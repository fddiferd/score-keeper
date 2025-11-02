from datetime import datetime, timezone
from typing import Optional, List, Dict
from pydantic import BaseModel, Field, computed_field, ConfigDict

def to_camel(s: str) -> str:
    """Convert snake_case to camelCase"""
    parts = s.split('_')
    return parts[0] + ''.join(p.capitalize() or '_' for p in parts[1:])

class Score(BaseModel):
    """Individual score for a player in a round"""
    model_config = ConfigDict(
        alias_generator=to_camel,
        populate_by_name=True
    )
    
    player_id: str  # References Player.id (works for both registered users and guests)
    score: int

class Player(BaseModel):
    model_config = ConfigDict(
        alias_generator=to_camel,
        populate_by_name=True
    )
    
    id: str
    name: str
    user_id: Optional[str] = None  # If present, this is a registered user; if None, it's a custom/guest player

class Round(BaseModel):
    model_config = ConfigDict(
        alias_generator=to_camel,
        populate_by_name=True
    )
    
    id: str
    scores: List[Score]  # List of player scores
    created_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))
    updated_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))

class Game(BaseModel):
    model_config = ConfigDict(
        alias_generator=to_camel,
        populate_by_name=True
    )
    
    id: Optional[str] = None
    name: str
    date: str
    players: List[Player]
    rounds: List[Round] = []  # Populated from subcollection, not stored in main doc
    target_score: int
    is_complete: bool = False
    user_id: str  # The user who created the game
    tenant_id: str  # For multi-tenancy support
    created_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))
    updated_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))
    
    @computed_field
    @property
    def user_ids(self) -> List[str]:
        """Auto-computed list of registered user IDs from players (excludes guests)"""
        return [player.user_id for player in self.players if player.user_id is not None]

class PlayerInput(BaseModel):
    """Input for creating a player - either userId OR customName must be provided"""
    model_config = ConfigDict(
        alias_generator=to_camel,
        populate_by_name=True
    )
    
    user_id: Optional[str] = None  # For registered users
    custom_name: Optional[str] = None  # For guest/temporary players

class GameCreate(BaseModel):
    model_config = ConfigDict(
        alias_generator=to_camel,
        populate_by_name=True
    )
    
    name: str
    players: List[PlayerInput]  # List of player inputs (either userId or customName)
    target_score: int = 500

class GameUpdate(BaseModel):
    model_config = ConfigDict(
        alias_generator=to_camel,
        populate_by_name=True
    )
    
    name: Optional[str] = None
    is_complete: Optional[bool] = None
    updated_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))

class RoundCreate(BaseModel):
    model_config = ConfigDict(
        alias_generator=to_camel,
        populate_by_name=True
    )
    
    scores: List[Score]

class RoundUpdate(BaseModel):
    model_config = ConfigDict(
        alias_generator=to_camel,
        populate_by_name=True
    )
    
    scores: List[Score]
    updated_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))

class GamesResponse(BaseModel):
    games: List[Game]
