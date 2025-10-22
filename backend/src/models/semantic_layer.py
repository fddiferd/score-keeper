from pydantic import BaseModel, Field, computed_field
from enum import Enum

class SemanticLayerType(Enum):
    DBT = 'dbt'

    @property
    def host(self) -> str:
        if self == SemanticLayerType.DBT:
            return 'semantic-layer.cloud.getdbt.com'
        else:
            raise ValueError(f'Invalid semantic layer type: {self}')

class SemanticLayerConfig(BaseModel):
    name: str
    type: SemanticLayerType
    display_name: str = Field(alias='displayName')
    environment_id: str = Field(alias='environmentId')
    service_token: str = Field(alias='token')
    
    @computed_field
    @property
    def host(self) -> str:
        return self.type.host
    
    class Config:
        populate_by_name = True