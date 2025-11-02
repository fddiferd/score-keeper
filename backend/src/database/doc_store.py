import os
import logging
import tempfile
import base64
from enum import Enum
from typing import Any, Optional, List, Dict
from firebase_admin import firestore, credentials
import firebase_admin
from google.cloud.firestore_v1.client import Client, CollectionReference
from google.cloud.firestore_v1.document import DocumentReference
from google.cloud.firestore_v1.query import Query

from environment import environment as env 

# =============================================================================
# MARK: CONSTANTS
# =============================================================================
# Query directions
QUERY_DIRECTIONS = {
    "ASC": Query.ASCENDING,
    "DESC": Query.DESCENDING
}

# =============================================================================
# MARK: LOGGING & GLOBALS
# =============================================================================

logger = logging.getLogger(__name__)

# Global variable to store the current database ID
CURRENT_DATABASE_ID: str = "dev-db"

# =============================================================================
# MARK: FIREBASE INITIALIZATION
# =============================================================================

def get_firebase_credentials() -> credentials.Certificate:
    """
    Get Firebase credentials from environment variable.
    """
    # Try loading from environment variable first (for CI/CD)
    env_creds = os.getenv("FIREBASE_SERVICE_ACCOUNT_KEY")
    if env_creds:
        try:
            logger.debug("Using Firebase credentials from environment variable")
            
            # Try to decode as base64 first (for .env files)
            try:
                decoded_creds = base64.b64decode(env_creds).decode('utf-8')
                logger.debug("Successfully decoded base64 credentials")
            except Exception:
                # If base64 decode fails, assume it's already plain JSON
                decoded_creds = env_creds
                logger.debug("Using credentials as plain JSON")
            
            # Write decoded credentials to temporary file
            with tempfile.NamedTemporaryFile(suffix='.json', delete=False, mode='w') as temp:
                temp.write(decoded_creds)
                temp_name = temp.name
            
            return credentials.Certificate(temp_name)
        except Exception as e:
            logger.error(f"Error loading Firebase credentials from environment variable: {e}")
    
    raise ValueError("Could not find Firebase credentials in environment variable")

def get_database_id_for_environment() -> str:
    """
    Get the appropriate database ID based on the current environment.
    """
    return env.database_id

def initialize_firebase() -> Client:
    """
    Initialize Firebase and return the Firestore client.
    """
    global CURRENT_DATABASE_ID
    
    try:
        database_id = get_database_id_for_environment()
        CURRENT_DATABASE_ID = database_id
        
        # Initialize Firebase app if not already done
        if not firebase_admin._apps:
            cred = get_firebase_credentials()
            firebase_admin.initialize_app(cred)
            logger.debug("Successfully initialized Firebase")

        # Create the Firestore client with the specific database ID
        db = firestore.client(database_id=database_id)
        
        logger.debug(f"Successfully initialized Firestore client for database: {database_id}")
        return db

    except Exception as e:
        logger.error(f"Failed to initialize Firebase: {e}")
        raise

# =============================================================================
# MARK: GLOBAL DATABASE INSTANCE
# =============================================================================

# Initialize the global db instance
try:
    db: Optional[Client] = initialize_firebase()
    logger.info("✅ Firebase initialized successfully")
except Exception as e:
    logger.warning(f"⚠️  Firebase not available: {e}")
    db = None

def get_db() -> Optional[Client]:
    """Return the global Firestore client."""
    return db

def is_database_available() -> bool:
    """Check if the database is available."""
    return db is not None

# =============================================================================
# MARK: HELPER FUNCTIONS
# =============================================================================
def _get_collection(collection_path: str, tenant_id: str | None = None) -> CollectionReference:
    """
    Get the collection path for the specified collection and tenant ID.
    """
    return db.collection(f"tenants/{tenant_id}/{collection_path}" if tenant_id else collection_path)

def _get_subcollection(parent_collection: str, parent_id: str, subcollection: str, tenant_id: str | None = None) -> CollectionReference:
    """
    Get a subcollection reference for a parent document.
    Example: get_rounds_subcollection("games", "game123", "rounds", "tenant1")
    """
    parent_ref = _get_doc_ref(parent_collection, parent_id, tenant_id)
    return parent_ref.collection(subcollection)

def _get_doc_ref(collection_path: str, doc_id: str, tenant_id: str | None = None) -> DocumentReference:
    """
    Get a document reference for the specified collection and document ID.
    """
    return _get_collection(collection_path, tenant_id).document(doc_id)

def _get_new_doc_ref(collection_path: str, tenant_id: str | None = None) -> DocumentReference:
    """
    Get a new document reference with auto-generated ID.
    """
    return _get_collection(collection_path, tenant_id).document()

def document_exists(doc_ref: DocumentReference) -> bool:
    """
    Check if a document exists using its reference.
    """
    return doc_ref.get().exists

def _get_document_data(doc_ref: DocumentReference) -> Optional[Dict[str, Any]]:
    """
    Get document data from a document reference.
    """
    doc = doc_ref.get()
    return doc.to_dict() if doc.exists else None

# =============================================================================
# MARK: DOCUMENT OPERATIONS
# =============================================================================

def add_document(collection_path: str, data: Dict[str, Any], tenant_id: str | None = None) -> str:
    """
    Add a document to a collection.
    """
    # Generate ID if not provided
    if "id" not in data or data["id"] is None:
        doc_ref = _get_new_doc_ref(collection_path, tenant_id)
        data["id"] = doc_ref.id
    else:
        doc_ref = _get_doc_ref(collection_path, data["id"], tenant_id)
    
    doc_ref.set(data)
    logger.debug(f"Added document with ID: {doc_ref.id}")
    return doc_ref.id

def get_document(collection_path: str, doc_id: str, tenant_id: str | None = None) -> Optional[Dict[str, Any]]:
    """
    Get a document by ID.
    """
    logger.debug(f"Getting document {doc_id} from {collection_path}")
    doc_ref = _get_doc_ref(collection_path, doc_id, tenant_id)
    doc_data = _get_document_data(doc_ref)
    
    if doc_data:
        logger.debug(f"Document data: {doc_data}")
    else:
        logger.error(f"Document {doc_id} does not exist!")
    
    return doc_data

def update_document(collection_path: str, doc_id: str, data: Dict[str, Any], tenant_id: str | None = None) -> Optional[Dict[str, Any]]:
    """
    Update a document with new data.
    """
    doc_ref = _get_doc_ref(collection_path, doc_id, tenant_id)
    
    if not document_exists(doc_ref):
        logger.error(f"Document {doc_id} does not exist!")
        return None
    
    doc_ref.update(data)
    logger.debug(f"Document {doc_id} updated with: {data}")
    return data

def update_field(collection_path: str, doc_id: str, field: str, value: Any, tenant_id: str | None = None) -> Optional[Dict[str, Any]]:
    """
    Update a specific field in a document.
    """
    doc_ref = _get_doc_ref(collection_path, doc_id, tenant_id)

    if not document_exists(doc_ref):
        logger.error(f"Document {doc_id} does not exist!")
        return None
    
    doc_ref.update({field: value})
    logger.debug(f"Document {doc_id} updated with: {field} = {value}")

    return _get_document_data(doc_ref)

def set_document(collection_path: str, doc_id: str, data: Dict[str, Any], tenant_id: str | None = None) -> Dict[str, Any]:
    """
    Set a document with new data. Creates the document if it doesn't exist.
    """
    doc_ref = _get_doc_ref(collection_path, doc_id, tenant_id)
    doc_ref.set(data, merge=True)
    logger.debug(f"Document {doc_id} set with: {data}")
    return data

def delete_document(collection_path: str, doc_id: str, tenant_id: str | None = None) -> bool:
    """
    Delete a document.
    """
    doc_ref = _get_doc_ref(collection_path, doc_id, tenant_id)
    doc_ref.delete()
    logger.debug(f"Document {doc_id} deleted")
    return True

def doc_exists(collection_path: str, doc_id: str, tenant_id: str | None = None) -> bool:
    """
    Check if a document exists.
    """
    doc_ref = _get_doc_ref(collection_path, doc_id, tenant_id)
    return document_exists(doc_ref)

# =============================================================================
# MARK: QUERY OPERATIONS
# =============================================================================

def query_documents(
    collection_path: str, 
    tenant_id: str | None = None,
    where_field: Optional[str] = None, 
    where_operator: Optional[str] = None, 
    where_value: Optional[Any] = None,
    order_by_field: Optional[str] = None,
    order_direction: str = "ASC",
    where_field_2: Optional[str] = None,
    where_operator_2: Optional[str] = None,
    where_value_2: Optional[Any] = None,
) -> List[Dict[str, Any]]:
    """
    Query documents in a collection with optional filtering and ordering.
    """
    collection_ref = _get_collection(collection_path, tenant_id)
    query = collection_ref

    # Apply first where clause
    if where_field and where_operator and where_value is not None:
        query = query.where(where_field, where_operator, where_value)
        
        # Apply second where clause if provided
        if where_field_2 and where_operator_2 and where_value_2 is not None:
            query = query.where(where_field_2, where_operator_2, where_value_2)

    # Apply ordering if specified
    if order_by_field:
        direction = QUERY_DIRECTIONS.get(order_direction, Query.ASCENDING)
        query = query.order_by(order_by_field, direction=direction)

    # Execute query and collect results
    results = []
    for doc in query.stream():
        doc_data = doc.to_dict()
        logger.debug(f"Document ID: {doc.id}, Data: {doc_data}")
        results.append(doc_data)
    
    return results

def query_documents_array_contains(
    collection_path: str, 
    array_field: str, 
    contains_value: Any,
    tenant_id: str | None = None,
    additional_where_field: Optional[str] = None,
    additional_where_operator: Optional[str] = None,
    additional_where_value: Optional[Any] = None,
    order_by_field: Optional[str] = None,
    order_direction: str = "ASC",
) -> List[Dict[str, Any]]:
    """
    Query documents in a collection where an array field contains a specific value.
    """
    collection_ref = _get_collection(collection_path, tenant_id)
    
    # Start with the array_contains query
    query = collection_ref.where(array_field, 'array_contains', contains_value)
    
    # Add additional where clause if provided
    if additional_where_field and additional_where_operator and additional_where_value is not None:
        query = query.where(additional_where_field, additional_where_operator, additional_where_value)
    
    # Apply ordering if specified
    if order_by_field:
        direction = QUERY_DIRECTIONS.get(order_direction, Query.ASCENDING)
        query = query.order_by(order_by_field, direction=direction)
    
    # Execute query and collect results
    results = []
    for doc in query.stream():
        doc_data = doc.to_dict()
        logger.debug(f"Document ID: {doc.id}, Data: {doc_data}")
        results.append(doc_data)
    
    return results

# =============================================================================
# MARK: SUBCOLLECTION OPERATIONS
# =============================================================================

def get_rounds_collection(game_id: str, tenant_id: str | None = None) -> CollectionReference:
    """
    Get the rounds subcollection for a specific game.
    """
    return _get_subcollection("games", game_id, "rounds", tenant_id)

def add_round_to_game(game_id: str, round_data: Dict[str, Any], tenant_id: str | None = None) -> str:
    """
    Add a round to a game's rounds subcollection.
    """
    rounds_collection = get_rounds_collection(game_id, tenant_id)
    
    # Generate ID if not provided
    if "id" not in round_data or round_data["id"] is None:
        doc_ref = rounds_collection.document()
        round_data["id"] = doc_ref.id
    else:
        doc_ref = rounds_collection.document(round_data["id"])
    
    doc_ref.set(round_data)
    logger.debug(f"Added round {doc_ref.id} to game {game_id}")
    return doc_ref.id

def get_round_from_game(game_id: str, round_id: str, tenant_id: str | None = None) -> Optional[Dict[str, Any]]:
    """
    Get a specific round from a game's rounds subcollection.
    """
    rounds_collection = get_rounds_collection(game_id, tenant_id)
    doc = rounds_collection.document(round_id).get()
    return doc.to_dict() if doc.exists else None

def get_all_rounds_for_game(game_id: str, tenant_id: str | None = None) -> List[Dict[str, Any]]:
    """
    Get all rounds for a game from its rounds subcollection.
    """
    rounds_collection = get_rounds_collection(game_id, tenant_id)
    
    results = []
    for doc in rounds_collection.order_by("created_at", direction=Query.ASCENDING).stream():
        doc_data = doc.to_dict()
        results.append(doc_data)
    
    logger.debug(f"Retrieved {len(results)} rounds for game {game_id}")
    return results

def update_round_in_game(game_id: str, round_id: str, update_data: Dict[str, Any], tenant_id: str | None = None) -> Optional[Dict[str, Any]]:
    """
    Update a round in a game's rounds subcollection.
    """
    rounds_collection = get_rounds_collection(game_id, tenant_id)
    doc_ref = rounds_collection.document(round_id)
    
    if not doc_ref.get().exists:
        logger.error(f"Round {round_id} does not exist in game {game_id}!")
        return None
    
    doc_ref.update(update_data)
    logger.debug(f"Updated round {round_id} in game {game_id} with: {update_data}")
    return update_data

def delete_round_from_game(game_id: str, round_id: str, tenant_id: str | None = None) -> bool:
    """
    Delete a round from a game's rounds subcollection.
    """
    rounds_collection = get_rounds_collection(game_id, tenant_id)
    doc_ref = rounds_collection.document(round_id)
    doc_ref.delete()
    logger.debug(f"Deleted round {round_id} from game {game_id}")
    return True