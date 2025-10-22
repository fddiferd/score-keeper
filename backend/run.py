# Standard library imports
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from dotenv import load_dotenv
import logging
import uvicorn


# Load environment variables BEFORE local imports
from environment import environment as env

# Local imports
from wristband.fastapi_auth import SessionMiddleware
from routes import router as all_routes

def create_app() -> FastAPI:
    app = FastAPI()

    # Set up logging
    if not logging.getLogger().hasHandlers():
        logging.basicConfig(level=logging.INFO, format="[%(asctime)s] %(levelname)s in %(name)s: %(message)s")

    ########################################################################################
    # IMPORTANT: FastAPI middleware runs in reverse order of the way it is added below!!
    ########################################################################################

    # Add session middleware
    app.add_middleware(
        SessionMiddleware,
        secret_key="a8f5f167f44f4964e6c998dee827110c",
        secure=env.is_deployed,  # Only secure cookies in deployment (HTTPS)
    )

    # Add CORS middleware
    allowed_origins = [
        f"{env.frontend_url}",
    ]

    if env.is_deployed:
        allowed_origins.append(f"{env.frontend_url}")
    
    app.add_middleware(
        CORSMiddleware,
        allow_origins=allowed_origins,
        allow_credentials=True,
        allow_methods=["*"],
        allow_headers=["*"]
    )
    
    # Include API routers
    app.include_router(all_routes)

    return app

# This app instance is used when imported by Uvicorn
app = create_app()

if __name__ == '__main__':
    # For Cloud Run, we need to bind to 0.0.0.0 and use the PORT environment variable
    is_deployed = env.is_deployed
    host = "0.0.0.0" if is_deployed else "localhost"
    port = 8080 if is_deployed else 6001
    
    uvicorn.run("run:app", host=host, port=port, reload=not is_deployed)
