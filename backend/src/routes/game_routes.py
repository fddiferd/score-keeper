from fastapi import APIRouter, Response, status, Depends, HTTPException
from fastapi.responses import JSONResponse
import logging
from typing import Optional, Dict, List
from datetime import datetime, timezone
import random
import string

from wristband.fastapi_auth import get_session
from auth.wristband import require_session_auth
from models.wristband.session import MySession
from models.game import Game, GameCreate, GameUpdate, RoundCreate, RoundUpdate, GamesResponse, Player, Round, PlayerInput
from database import doc_store

router = APIRouter(dependencies=[Depends(require_session_auth)])

logger = logging.getLogger(__name__)

COLLECTION_PATH = "games"

def generate_id() -> str:
    """Generate a random ID."""
    timestamp = str(int(datetime.now().timestamp() * 1000))
    random_suffix = ''.join(random.choices(string.ascii_lowercase + string.digits, k=6))
    return f"{timestamp}_{random_suffix}"

def calculate_player_totals(game: Game, rounds: List[Round]) -> Dict[str, int]:
    """Calculate total scores for all players."""
    totals: Dict[str, int] = {}
    
    # Initialize totals for all players
    for player in game.players:
        totals[player.id] = 0
    
    # Sum up scores from all rounds
    for round in rounds:
        for score_entry in round.scores:
            totals[score_entry.player_id] = totals.get(score_entry.player_id, 0) + score_entry.score
    
    return totals

async def get_user_display_name(user_id: str, access_token: str) -> Optional[str]:
    """Fetch user display name from Wristband API."""
    try:
        from clients.wristband_client import WristbandClient
        wristband_client = WristbandClient()
        user = await wristband_client.get_user_info(user_id=user_id, access_token=access_token)
        
        # Build display name from User model
        if user.givenName and user.familyName:
            return f"{user.givenName} {user.familyName}"
        elif user.givenName:
            return user.givenName
        elif user.email:
            return user.email
        return "Unknown User"
    except Exception as e:
        logger.warning(f"Error fetching user {user_id}: {e}")
        return "Unknown User"

@router.post('', response_model=Game)
async def create_game(game_data: GameCreate, session: MySession = Depends(get_session)) -> Response:
    """Create a new game."""
    try:
        # Create players from input
        players = []
        for idx, player_input in enumerate(game_data.players):
            player_id = f"{generate_id()}_{idx}"
            
            if player_input.user_id:
                # Registered user - fetch their display name
                display_name = await get_user_display_name(player_input.user_id, session.access_token)
                players.append(Player(
                    id=player_id,
                    name=display_name,
                    user_id=player_input.user_id
                ))
                logger.debug(f"Added registered user player: {display_name} (user_id: {player_input.user_id})")
            elif player_input.custom_name:
                # Guest/custom player
                players.append(Player(
                    id=player_id,
                    name=player_input.custom_name.strip(),
                    user_id=None
                ))
                logger.debug(f"Added custom player: {player_input.custom_name}")
            else:
                logger.warning(f"Invalid player input at index {idx}: neither userId nor customName provided")
                continue
        
        if len(players) < 2:
            raise HTTPException(status_code=400, detail="At least 2 players are required")
        
        # Create the game (rounds will be in subcollection)
        game = Game(
            id=generate_id(),
            name=game_data.name,
            date=datetime.now().isoformat(),
            players=players,
            target_score=game_data.target_score,
            is_complete=False,
            user_id=session.user_id,
            tenant_id=session.tenant_id
        )
        
        # Save to database (game only, no rounds yet)
        # Use by_alias=False to store in snake_case for database
        game_dict = game.model_dump(by_alias=False, mode='json', exclude={'rounds'})
        # Add computed user_ids field manually
        game_dict['user_ids'] = game.user_ids
        
        doc_store.add_document(
            COLLECTION_PATH, 
            game_dict,
            tenant_id=session.tenant_id
        )
        
        logger.info(f"Created game {game.id} for user {session.user_id} with {len(players)} players")
        
        # Return game with empty rounds array
        return JSONResponse(content=game.model_dump(by_alias=True, mode='json'), status_code=status.HTTP_201_CREATED)
        
    except HTTPException:
        raise
    except Exception as e:
        logger.exception(f"Error creating game: {str(e)}")
        return Response(status_code=status.HTTP_500_INTERNAL_SERVER_ERROR)

@router.get('/my-active-games', response_model=GamesResponse)
async def get_my_active_games(session: MySession = Depends(get_session)) -> Response:
    """Get in-progress games where the current user is a player."""
    try:
        # Query games where user_ids array contains current user and is_complete is false
        games_data = doc_store.query_documents_array_contains(
            COLLECTION_PATH,
            array_field="user_ids",
            contains_value=session.user_id,
            tenant_id=session.tenant_id,
            additional_where_field="is_complete",
            additional_where_operator="==",
            additional_where_value=False,
            order_by_field="updated_at",
            order_direction="DESC"
        )
        
        # Build games with rounds from subcollection
        games = []
        for game_data in games_data:
            # Get rounds from subcollection
            rounds_data = doc_store.get_all_rounds_for_game(game_data["id"], tenant_id=session.tenant_id)
            rounds = [Round(**round_data) for round_data in rounds_data]
            
            # Add rounds to game data
            game_data["rounds"] = rounds
            
            # Create game with rounds
            game = Game(**game_data)
            games.append(game)
        
        return JSONResponse(content={"games": [game.model_dump(by_alias=True, mode='json') for game in games]})
        
    except Exception as e:
        logger.exception(f"Error getting active games: {str(e)}")
        return Response(status_code=status.HTTP_500_INTERNAL_SERVER_ERROR)

@router.get('', response_model=GamesResponse)
async def get_games(
    session: MySession = Depends(get_session),
    tenant_wide: bool = False,
    user_id: str = None
) -> Response:
    """Get games for the current user or all games in tenant."""
    try:
        if tenant_wide:
            # Get all games in the tenant, optionally filtered by user_id
            if user_id:
                games_data = doc_store.query_documents(
                    COLLECTION_PATH,
                    tenant_id=session.tenant_id,
                    where_field="user_id",
                    where_operator="==",
                    where_value=user_id,
                    order_by_field="date",
                    order_direction="DESC"
                )
            else:
                # Get all games for the tenant
                games_data = doc_store.query_documents(
                    COLLECTION_PATH,
                    tenant_id=session.tenant_id,
                    order_by_field="date",
                    order_direction="DESC"
                )
        else:
            # Query games for this user only
            games_data = doc_store.query_documents(
                COLLECTION_PATH,
                tenant_id=session.tenant_id,
                where_field="user_id",
                where_operator="==",
                where_value=session.user_id,
                order_by_field="date",
                order_direction="DESC"
            )
        
        # Build games with rounds from subcollection
        games = []
        for game_data in games_data:
            # Get rounds from subcollection
            rounds_data = doc_store.get_all_rounds_for_game(game_data["id"], tenant_id=session.tenant_id)
            rounds = [Round(**round_data) for round_data in rounds_data]
            
            # Add rounds to game data
            game_data["rounds"] = rounds
            
            # Create game with rounds
            game = Game(**game_data)
            games.append(game)
        
        return JSONResponse(content={"games": [game.model_dump(by_alias=True, mode='json') for game in games]})
        
    except Exception as e:
        logger.exception(f"Error getting games: {str(e)}")
        return Response(status_code=status.HTTP_500_INTERNAL_SERVER_ERROR)

@router.get('/{game_id}', response_model=Game)
async def get_game(game_id: str, session: MySession = Depends(get_session)) -> Response:
    """Get a specific game by ID."""
    try:
        game_data = doc_store.get_document(
            COLLECTION_PATH, 
            game_id,
            tenant_id=session.tenant_id
        )
        
        if not game_data:
            raise HTTPException(status_code=404, detail="Game not found")
        
        # Verify the game belongs to the user or is in the tenant
        if game_data.get("user_id") != session.user_id and game_data.get("tenant_id") != session.tenant_id:
            raise HTTPException(status_code=403, detail="Not authorized to access this game")
        
        # Get rounds from subcollection
        rounds_data = doc_store.get_all_rounds_for_game(game_id, tenant_id=session.tenant_id)
        rounds = [Round(**round_data) for round_data in rounds_data]
        game_data["rounds"] = rounds
        
        game = Game(**game_data)
        return JSONResponse(content=game.model_dump(by_alias=True, mode='json'))
        
    except HTTPException:
        raise
    except Exception as e:
        logger.exception(f"Error getting game: {str(e)}")
        return Response(status_code=status.HTTP_500_INTERNAL_SERVER_ERROR)

@router.put('/{game_id}', response_model=Game)
async def update_game(game_id: str, game_update: GameUpdate, session: MySession = Depends(get_session)) -> Response:
    """Update a game."""
    try:
        # Get existing game
        game_data = doc_store.get_document(
            COLLECTION_PATH, 
            game_id,
            tenant_id=session.tenant_id
        )
        
        if not game_data:
            raise HTTPException(status_code=404, detail="Game not found")
        
        # Verify the game belongs to the user
        if game_data.get("user_id") != session.user_id:
            raise HTTPException(status_code=403, detail="Not authorized to update this game")
        
        # Update only provided fields (with snake_case conversion)
        update_data = game_update.model_dump(exclude_unset=True, by_alias=False)
        
        doc_store.update_document(
            COLLECTION_PATH,
            game_id,
            update_data,
            tenant_id=session.tenant_id
        )
        
        # Get updated game with rounds
        updated_game_data = doc_store.get_document(
            COLLECTION_PATH, 
            game_id,
            tenant_id=session.tenant_id
        )
        
        # Get rounds from subcollection
        rounds_data = doc_store.get_all_rounds_for_game(game_id, tenant_id=session.tenant_id)
        rounds = [Round(**round_data) for round_data in rounds_data]
        updated_game_data["rounds"] = rounds
        
        game = Game(**updated_game_data)
        return JSONResponse(content=game.model_dump(by_alias=True, mode='json'))
        
    except HTTPException:
        raise
    except Exception as e:
        logger.exception(f"Error updating game: {str(e)}")
        return Response(status_code=status.HTTP_500_INTERNAL_SERVER_ERROR)

@router.delete('/{game_id}')
async def delete_game(game_id: str, session: MySession = Depends(get_session)) -> Response:
    """Delete a game and all its rounds."""
    try:
        # Get existing game to verify ownership
        game_data = doc_store.get_document(
            COLLECTION_PATH, 
            game_id,
            tenant_id=session.tenant_id
        )
        
        if not game_data:
            raise HTTPException(status_code=404, detail="Game not found")
        
        # Verify the game belongs to the user
        if game_data.get("user_id") != session.user_id:
            raise HTTPException(status_code=403, detail="Not authorized to delete this game")
        
        # Delete all rounds from subcollection first
        rounds_data = doc_store.get_all_rounds_for_game(game_id, tenant_id=session.tenant_id)
        for round_data in rounds_data:
            doc_store.delete_round_from_game(game_id, round_data["id"], tenant_id=session.tenant_id)
        
        # Delete the game document
        doc_store.delete_document(
            COLLECTION_PATH,
            game_id,
            tenant_id=session.tenant_id
        )
        
        logger.info(f"Deleted game {game_id} and {len(rounds_data)} rounds")
        return JSONResponse(content={"message": "Game deleted successfully"})
        
    except HTTPException:
        raise
    except Exception as e:
        logger.exception(f"Error deleting game: {str(e)}")
        return Response(status_code=status.HTTP_500_INTERNAL_SERVER_ERROR)

@router.post('/{game_id}/rounds', response_model=Game)
async def add_round(game_id: str, round_data: RoundCreate, session: MySession = Depends(get_session)) -> Response:
    """Add a round to a game."""
    try:
        # Get existing game
        game_data = doc_store.get_document(
            COLLECTION_PATH, 
            game_id,
            tenant_id=session.tenant_id
        )
        
        if not game_data:
            raise HTTPException(status_code=404, detail="Game not found")
        
        # Verify the game belongs to the user or user is in the game
        if game_data.get("user_id") != session.user_id:
            # Check if current user is a player in the game
            user_ids = game_data.get("user_ids", [])
            if session.user_id not in user_ids:
                raise HTTPException(status_code=403, detail="Not authorized to modify this game")
        
        # Create new round
        new_round = Round(
            id=generate_id(),
            scores=round_data.scores
        )
        
        # Add round to subcollection
        doc_store.add_round_to_game(
            game_id,
            new_round.model_dump(by_alias=False),
            tenant_id=session.tenant_id
        )
        
        # Get all rounds to check if game is complete
        rounds_data = doc_store.get_all_rounds_for_game(game_id, tenant_id=session.tenant_id)
        rounds = [Round(**rd) for rd in rounds_data]
        
        # Build temporary game object for calculation
        temp_game = Game(**game_data)
        player_totals = calculate_player_totals(temp_game, rounds)
        is_complete = any(total >= temp_game.target_score for total in player_totals.values())
        
        # Update game completion status if needed
        if is_complete != game_data.get("is_complete"):
            doc_store.update_document(
                COLLECTION_PATH,
                game_id,
                {"is_complete": is_complete, "updated_at": datetime.now(timezone.utc)},
                tenant_id=session.tenant_id
            )
            game_data["is_complete"] = is_complete
        
        # Get updated game with all rounds
        game_data["rounds"] = rounds
        game = Game(**game_data)
        
        return JSONResponse(content=game.model_dump(by_alias=True, mode='json'))
        
    except HTTPException:
        raise
    except Exception as e:
        logger.exception(f"Error adding round: {str(e)}")
        return Response(status_code=status.HTTP_500_INTERNAL_SERVER_ERROR)

@router.get('/{game_id}/rounds', response_model=List[Round])
async def get_rounds(game_id: str, session: MySession = Depends(get_session)) -> Response:
    """Get all rounds for a game."""
    try:
        # Get game to verify access
        game_data = doc_store.get_document(
            COLLECTION_PATH,
            game_id,
            tenant_id=session.tenant_id
        )
        
        if not game_data:
            raise HTTPException(status_code=404, detail="Game not found")
        
        # Get rounds from subcollection
        rounds_data = doc_store.get_all_rounds_for_game(game_id, tenant_id=session.tenant_id)
        rounds = [Round(**round_data) for round_data in rounds_data]
        
        return JSONResponse(content=[round.model_dump(by_alias=True, mode='json') for round in rounds])
        
    except HTTPException:
        raise
    except Exception as e:
        logger.exception(f"Error getting rounds: {str(e)}")
        return Response(status_code=status.HTTP_500_INTERNAL_SERVER_ERROR)

@router.put('/{game_id}/rounds/{round_id}', response_model=Game)
async def edit_round(game_id: str, round_id: str, round_update: RoundUpdate, session: MySession = Depends(get_session)) -> Response:
    """Edit a round in a game."""
    try:
        # Get existing game
        game_data = doc_store.get_document(
            COLLECTION_PATH, 
            game_id,
            tenant_id=session.tenant_id
        )
        
        if not game_data:
            raise HTTPException(status_code=404, detail="Game not found")
        
        # Verify the game belongs to the user or user is in the game
        if game_data.get("user_id") != session.user_id:
            user_ids = game_data.get("user_ids", [])
            if session.user_id not in user_ids:
                raise HTTPException(status_code=403, detail="Not authorized to modify this game")
        
        # Check if round exists
        existing_round = doc_store.get_round_from_game(game_id, round_id, tenant_id=session.tenant_id)
        if not existing_round:
            raise HTTPException(status_code=404, detail="Round not found")
        
        # Update round in subcollection
        update_data = round_update.model_dump(by_alias=False)
        doc_store.update_round_in_game(
            game_id,
            round_id,
            update_data,
            tenant_id=session.tenant_id
        )
        
        # Get all rounds to recalculate completion status
        rounds_data = doc_store.get_all_rounds_for_game(game_id, tenant_id=session.tenant_id)
        rounds = [Round(**rd) for rd in rounds_data]
        
        # Build temporary game object for calculation
        temp_game = Game(**game_data)
        player_totals = calculate_player_totals(temp_game, rounds)
        is_complete = any(total >= temp_game.target_score for total in player_totals.values())
        
        # Update game completion status if changed
        if is_complete != game_data.get("is_complete"):
            doc_store.update_document(
                COLLECTION_PATH,
                game_id,
                {"is_complete": is_complete, "updated_at": datetime.now(timezone.utc)},
                tenant_id=session.tenant_id
            )
            game_data["is_complete"] = is_complete
        
        # Return updated game with rounds
        game_data["rounds"] = rounds
        game = Game(**game_data)
        
        return JSONResponse(content=game.model_dump(by_alias=True, mode='json'))
        
    except HTTPException:
        raise
    except Exception as e:
        logger.exception(f"Error editing round: {str(e)}")
        return Response(status_code=status.HTTP_500_INTERNAL_SERVER_ERROR)

@router.put('/{game_id}/complete', response_model=Game)
async def complete_game(game_id: str, session: MySession = Depends(get_session)) -> Response:
    """Mark a game as complete."""
    try:
        # Get existing game
        game_data = doc_store.get_document(
            COLLECTION_PATH, 
            game_id,
            tenant_id=session.tenant_id
        )
        
        if not game_data:
            logger.error(f"Game {game_id} not found")
            raise HTTPException(status_code=404, detail="Game not found")
        
        logger.info(f"Attempting to complete game {game_id}. Current is_complete: {game_data.get('is_complete')}, user_id: {game_data.get('user_id')}, session user: {session.user_id}")
        
        # Verify the game belongs to the user or user is in the game
        if game_data.get("user_id") != session.user_id:
            user_ids = game_data.get("user_ids", [])
            if session.user_id not in user_ids:
                logger.warning(f"User {session.user_id} tried to complete game {game_id} owned by {game_data.get('user_id')}")
                raise HTTPException(status_code=403, detail="Not authorized to modify this game")
        
        # Update game to mark as complete
        update_result = doc_store.update_document(
            COLLECTION_PATH,
            game_id,
            {"is_complete": True, "updated_at": datetime.now(timezone.utc)},
            tenant_id=session.tenant_id
        )
        
        if not update_result:
            logger.error(f"Failed to update game {game_id} in database")
            raise HTTPException(status_code=500, detail="Failed to update game")
        
        # Get updated game with rounds
        updated_game_data = doc_store.get_document(
            COLLECTION_PATH, 
            game_id,
            tenant_id=session.tenant_id
        )
        
        if not updated_game_data:
            logger.error(f"Game {game_id} disappeared after update!")
            raise HTTPException(status_code=500, detail="Game not found after update")
        
        # Get rounds from subcollection
        rounds_data = doc_store.get_all_rounds_for_game(game_id, tenant_id=session.tenant_id)
        rounds = [Round(**rd) for rd in rounds_data]
        updated_game_data["rounds"] = rounds
        
        logger.info(f"Successfully marked game {game_id} as complete. New is_complete: {updated_game_data.get('is_complete')}")
        
        game = Game(**updated_game_data)
        return JSONResponse(content=game.model_dump(by_alias=True, mode='json'))
        
    except HTTPException:
        raise
    except Exception as e:
        logger.exception(f"Error completing game: {str(e)}")
        return Response(status_code=status.HTTP_500_INTERNAL_SERVER_ERROR)

