from datetime import datetime, timezone
from typing import Optional, List, Dict
from pydantic import BaseModel, Field, computed_field

class Player(BaseModel):
    id: str
    name: str
    user_id: Optional[str] = Field(None, alias="userId")  # If present, this is a registered user; if None, it's a custom/guest player
    
    class Config:
        populate_by_name = True

class Round(BaseModel):
    id: str
    scores: Dict[str, int]  # player_id -> score
    created_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc), alias="createdAt")
    updated_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc), alias="updatedAt")
    
    class Config:
        populate_by_name = True

class Game(BaseModel):
    id: Optional[str] = None
    name: str
    date: str
    players: List[Player]
    rounds: List[Round] = []  # Populated from subcollection, not stored in main doc
    target_score: int = Field(alias="targetScore")
    is_complete: bool = Field(False, alias="isComplete")
    user_id: str = Field(alias="userId")  # The user who created the game
    tenant_id: str = Field(alias="tenantId")  # For multi-tenancy support
    created_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc), alias="createdAt")
    updated_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc), alias="updatedAt")
    
    @computed_field
    @property
    def user_ids(self) -> List[str]:
        """Auto-computed list of registered user IDs from players (excludes guests)"""
        return [player.user_id for player in self.players if player.user_id is not None]
    
    class Config:
        populate_by_name = True

class PlayerInput(BaseModel):
    """Input for creating a player - either userId OR customName must be provided"""
    user_id: Optional[str] = Field(None, alias="userId")  # For registered users
    custom_name: Optional[str] = Field(None, alias="customName")  # For guest/temporary players
    
    class Config:
        populate_by_name = True

class GameCreate(BaseModel):
    name: str
    players: List[PlayerInput]  # List of player inputs (either userId or customName)
    target_score: int = Field(500, alias="targetScore")
    
    class Config:
        populate_by_name = True

class GameUpdate(BaseModel):
    name: Optional[str] = None
    is_complete: Optional[bool] = Field(None, alias="isComplete")
    updated_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc), alias="updatedAt")
    
    class Config:
        populate_by_name = True

class RoundCreate(BaseModel):
    scores: Dict[str, int]

class RoundUpdate(BaseModel):
    scores: Dict[str, int]
    updated_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc), alias="updatedAt")
    
    class Config:
        populate_by_name = True

class GamesResponse(BaseModel):
    games: List[Game]
