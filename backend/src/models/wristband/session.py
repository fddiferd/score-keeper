from wristband.fastapi_auth import Session
from typing import Optional, Protocol


# WRISTBAND_TOUCHPOINT: Extend Session Protocol
class MySession(Session, Protocol):
    idp_name: Optional[str]
