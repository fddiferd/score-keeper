
from typing import Optional, List
from fastapi import APIRouter, Request, status, Depends
from fastapi.responses import JSONResponse
import logging

from wristband.fastapi_auth import get_session

from database.doc_store import set_document, doc_exists, get_document, query_documents, delete_document, is_database_available
from models.semantic_layer import SemanticLayerConfig
from services.encryption_service import encrypt_secret, decrypt_secret, is_encryption_available
from auth.wristband import require_session_auth
from models.wristband.session import MySession

router = APIRouter(dependencies=[Depends(require_session_auth)])
logger = logging.getLogger(__name__)

@router.post('/upsert', response_model=SemanticLayerConfig)
async def upsert_semantic_layer(semantic_layer_config: SemanticLayerConfig, session: MySession = Depends(get_session)):
    """
    Upsert (create or update) a semantic layer for the current tenant
    """
    if not is_database_available():
        return JSONResponse(
            status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
            content={"error": "datastore_unavailable", "message": "Datastore not enabled"}
        )
    
    if not is_encryption_available():
        return JSONResponse(
            status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
            content={"error": "encryption_unavailable", "message": "Encryption service not available"}
        )
    
    try:
        # Get tenant ID from session
        tenant_id = session.tenant_id
        
        # Convert Pydantic model to dict with proper serialization
        secret_data = semantic_layer_config.model_dump(mode='json')
        
        # Encrypt the service_token value before storing
        try:
            secret_data['service_token'] = encrypt_secret(secret_data['service_token'])
            logger.debug(f"Successfully encrypted service_token for name: {semantic_layer_config.name}")
        except Exception as e:
            logger.error(f"Failed to encrypt service_token: {str(e)}")
            return JSONResponse(
                status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                content={"error": "encryption_error", "message": "Failed to encrypt token data"}
            )
        
        # Update the semantic layer in firestore
        set_document(
            collection_path=f"tenants/{tenant_id}/semantic-layers",
            doc_id=semantic_layer_config.name,
            data=secret_data
        )
        
        logger.info(f"Successfully upserted encrypted semantic layer with name: {semantic_layer_config.name} for tenant: {tenant_id}")
        return semantic_layer_config
        
    except Exception as e:
        logger.exception(f"Unexpected error upserting semantic layer: {str(e)}")
        return JSONResponse(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            content={"error": "internal_error", "message": "An unexpected error occurred while saving the semantic layer."}
        )

@router.get('/check/{name}')
async def check_semantic_layer_exists(name: str, session: MySession = Depends(get_session)):
    """
    Check if a semantic layer with the given name exists for the current tenant
    """
    if not is_database_available():
        return JSONResponse(
            status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
            content={"error": "datastore_unavailable", "message": "Datastore not enabled"}
        )
    
    try:
        # Get tenant ID from session
        tenant_id = session.tenant_id
        
        # Check if document exists
        exists = doc_exists(
            collection_path=f"tenants/{tenant_id}/semantic-layers",
            doc_id=name
        )
        
        return {"exists": exists}
        
    except Exception as e:
        logger.exception(f"Error checking semantic layer existence: {str(e)}")
        return JSONResponse(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            content={"error": "internal_error", "message": "An unexpected error occurred while checking the semantic layer."}
        )

@router.get('', response_model=List[SemanticLayerConfig])
async def get_semantic_layers(session: MySession = Depends(get_session)):
    """
    Get all semantic layers for the current tenant
    """
    if not is_database_available():
        return JSONResponse(
            status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
            content={"error": "datastore_unavailable", "message": "Datastore not enabled"}
        )
    
    if not is_encryption_available():
        return JSONResponse(
            status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
            content={"error": "encryption_unavailable", "message": "Encryption service not available"}
        )
    
    try:
        # Get tenant ID from session
        tenant_id = session.tenant_id
        
        # Query all semantic layers for this tenant
        encrypted_semantic_layers = query_documents(
            collection_path=f"tenants/{tenant_id}/semantic-layers",
            order_by_field="display_name",
            order_direction="ASC"
        )
        
        # Decrypt the service_token values before returning
        decrypted_semantic_layers = []
        for semantic_layer_data in encrypted_semantic_layers:
            try:
                # Create a copy of the semantic layer data
                decrypted_semantic_layer = dict(semantic_layer_data)
                # Decrypt the service_token value
                decrypted_semantic_layer['service_token'] = decrypt_secret(semantic_layer_data['service_token'])
                decrypted_semantic_layers.append(decrypted_semantic_layer)
            except Exception as e:
                logger.error(f"Failed to decrypt semantic layer {semantic_layer_data.get('name', 'unknown')}: {str(e)}")
                # Skip this semantic layer if decryption fails
                continue
        
        logger.debug(f"Successfully decrypted {len(decrypted_semantic_layers)} semantic layers for tenant: {tenant_id}")
        return decrypted_semantic_layers
        
    except Exception as e:
        logger.exception(f"Error fetching semantic layers: {str(e)}")
        return JSONResponse(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            content={"error": "internal_error", "message": "An unexpected error occurred while fetching semantic layers."}
        )

@router.get('/{name}', response_model=SemanticLayerConfig)
async def get_semantic_layer(name: str, session: MySession = Depends(get_session)):
    """
    Get a specific semantic layer by name for the current tenant
    """
    if not is_database_available():
        return JSONResponse(
            status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
            content={"error": "datastore_unavailable", "message": "Datastore not enabled"}
        )
    
    if not is_encryption_available():
        return JSONResponse(
            status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
            content={"error": "encryption_unavailable", "message": "Encryption service not available"}
        )
    
    try:
        # Get tenant ID from session
        tenant_id = session.tenant_id
        
        # Get the encrypted semantic layer
        encrypted_semantic_layer = get_document(
            collection_path=f"tenants/{tenant_id}/semantic-layers",
            doc_id=name
        )
        
        if not encrypted_semantic_layer:
            return JSONResponse(
                status_code=status.HTTP_404_NOT_FOUND,
                content={"error": "not_found", "message": f"Semantic layer with name '{name}' not found."}
            )
        
        # Decrypt the service_token value before returning
        try:
            decrypted_semantic_layer = dict(encrypted_semantic_layer)
            decrypted_semantic_layer['service_token'] = decrypt_secret(encrypted_semantic_layer['service_token'])
            logger.debug(f"Successfully decrypted service_token for name: {name}")
            return decrypted_semantic_layer
        except Exception as e:
            logger.error(f"Failed to decrypt semantic layer {name}: {str(e)}")
            return JSONResponse(
                status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                content={"error": "decryption_error", "message": "Failed to decrypt semantic layer data"}
            )
        
    except Exception as e:
        logger.exception(f"Error fetching semantic layer: {str(e)}")
        return JSONResponse(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            content={"error": "internal_error", "message": "An unexpected error occurred while fetching the semantic layer."}
        )

@router.delete('/{name}')
async def delete_semantic_layer(name: str, session: MySession = Depends(get_session)):
    """
    Delete a semantic layer by name for the current tenant
    """
    if not is_database_available():
        return JSONResponse(
            status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
            content={"error": "datastore_unavailable", "message": "Datastore not enabled"}
        )
    
    try:
        # Get tenant ID from session
        tenant_id = session.tenant_id
        
        # Check if semantic layer exists
        if not doc_exists(
            collection_path=f"tenants/{tenant_id}/semantic-layers",
            doc_id=name
        ):
            return JSONResponse(
                status_code=status.HTTP_404_NOT_FOUND,
                content={"error": "not_found", "message": f"Semantic layer with name '{name}' not found."}
            )
        
        # Delete the semantic layer
        delete_document(
            collection_path=f"tenants/{tenant_id}/semantic-layers",
            doc_id=name
        )
        
        logger.info(f"Successfully deleted semantic layer with name: {name} for tenant: {tenant_id}")
        return {"message": "Semantic layer deleted successfully"}
        
    except Exception as e:
        logger.exception(f"Error deleting semantic layer: {str(e)}")
        return JSONResponse(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            content={"error": "internal_error", "message": "An unexpected error occurred while deleting the semantic layer."}
        )