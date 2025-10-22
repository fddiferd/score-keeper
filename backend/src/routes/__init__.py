from fastapi import APIRouter
from fastapi.responses import JSONResponse

from .wristband.auth_routes import router as auth_router
from .wristband.nickname_routes import router as nickname_router
from .wristband.user_routes import router as user_router
from .wristband.users_routes import router as users_router
from .wristband.tenant_routes import router as tenant_router
from .wristband.idp_routes import router as idp_router
from .semantic_layers_routes import router as semantic_layers_router
from .wristband.role_routes import router as role_router

router = APIRouter()

# Add root endpoint
@router.get("/")
async def root():
    return JSONResponse({
        "message": "API",
        "status": "running",
        "endpoints": {
            "auth": "/api/auth/login",
            "session": "/api/session", 
            "docs": "/docs"
        }
    })

router.include_router(auth_router, prefix='/api/auth')
router.include_router(nickname_router, prefix='/api/nickname')
router.include_router(user_router, prefix='/api/user')
router.include_router(users_router, prefix='/api/users')
router.include_router(tenant_router, prefix='/api/tenant')
router.include_router(idp_router, prefix='/api/idp')
router.include_router(semantic_layers_router, prefix='/api/semantic-layers')
router.include_router(role_router, prefix='/api/roles')
