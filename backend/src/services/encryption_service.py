import os
import base64
import logging
from cryptography.fernet import Fernet
from cryptography.hazmat.primitives import hashes
from cryptography.hazmat.primitives.kdf.pbkdf2 import PBKDF2HMAC
from typing import Optional

logger = logging.getLogger(__name__)

class EncryptionService:
    """
    Service for encrypting and decrypting sensitive data like secrets.
    Uses Fernet symmetric encryption with a key derived from environment variables.
    """
    
    def __init__(self):
        self._fernet: Optional[Fernet] = None
        self._initialize_encryption()
    
    def _initialize_encryption(self):
        """Initialize the encryption key from environment variables."""
        try:
            # Get encryption key from environment
            encryption_key = os.getenv('ENCRYPTION_KEY')
            
            if not encryption_key:
                # Generate a key from a master password if ENCRYPTION_KEY is not set
                master_password = os.getenv('MASTER_PASSWORD', 'default-dev-password-change-in-production')
                logger.debug("ENCRYPTION_KEY not found, deriving key from MASTER_PASSWORD")
                
                # Use a fixed salt for consistency (in production, consider using a stored salt)
                salt = b'metric-layer-ai-salt-2024'
                
                # Derive key from master password
                kdf = PBKDF2HMAC(
                    algorithm=hashes.SHA256(),
                    length=32,
                    salt=salt,
                    iterations=100000,
                )
                key = base64.urlsafe_b64encode(kdf.derive(master_password.encode()))
            else:
                # Use the provided encryption key
                key = encryption_key.encode()
                # Ensure the key is the right length for Fernet
                if len(key) != 44:  # Fernet keys are 44 bytes when base64 encoded
                    # Derive a proper key if the provided key isn't the right format
                    kdf = PBKDF2HMAC(
                        algorithm=hashes.SHA256(),
                        length=32,
                        salt=b'metric-layer-ai-salt-2024',
                        iterations=100000,
                    )
                    key = base64.urlsafe_b64encode(kdf.derive(key))
            
            self._fernet = Fernet(key)
            logger.info("Encryption service initialized successfully")
            
        except Exception as e:
            logger.error(f"Failed to initialize encryption service: {str(e)}")
            raise RuntimeError(f"Encryption initialization failed: {str(e)}")
    
    def encrypt(self, plaintext: str) -> str:
        """
        Encrypt a plaintext string.
        
        Args:
            plaintext: The string to encrypt
            
        Returns:
            Base64 encoded encrypted string
            
        Raises:
            RuntimeError: If encryption fails
        """
        if not self._fernet:
            raise RuntimeError("Encryption service not initialized")
        
        try:
            # Convert string to bytes and encrypt
            plaintext_bytes = plaintext.encode('utf-8')
            encrypted_bytes = self._fernet.encrypt(plaintext_bytes)
            
            # Return as base64 string for easy storage
            return base64.urlsafe_b64encode(encrypted_bytes).decode('utf-8')
            
        except Exception as e:
            logger.error(f"Encryption failed: {str(e)}")
            raise RuntimeError(f"Failed to encrypt data: {str(e)}")
    
    def decrypt(self, encrypted_data: str) -> str:
        """
        Decrypt an encrypted string.
        
        Args:
            encrypted_data: Base64 encoded encrypted string
            
        Returns:
            Decrypted plaintext string
            
        Raises:
            RuntimeError: If decryption fails
        """
        if not self._fernet:
            raise RuntimeError("Encryption service not initialized")
        
        try:
            # Decode from base64 and decrypt
            encrypted_bytes = base64.urlsafe_b64decode(encrypted_data.encode('utf-8'))
            decrypted_bytes = self._fernet.decrypt(encrypted_bytes)
            
            # Convert back to string
            return decrypted_bytes.decode('utf-8')
            
        except Exception as e:
            logger.error(f"Decryption failed: {str(e)}")
            raise RuntimeError(f"Failed to decrypt data: {str(e)}")
    
    def is_available(self) -> bool:
        """Check if the encryption service is available and working."""
        return self._fernet is not None
    
    @staticmethod
    def generate_key() -> str:
        """
        Generate a new encryption key for use in production.
        This should be called once and the key stored securely.
        
        Returns:
            Base64 encoded encryption key suitable for ENCRYPTION_KEY environment variable
        """
        key = Fernet.generate_key()
        return key.decode('utf-8')


# Global instance
_encryption_service: Optional[EncryptionService] = None

def get_encryption_service() -> EncryptionService:
    """
    Get the global encryption service instance.
    Creates it if it doesn't exist.
    """
    global _encryption_service
    if _encryption_service is None:
        _encryption_service = EncryptionService()
    return _encryption_service

def encrypt_secret(plaintext: str) -> str:
    """Convenience function to encrypt a secret."""
    return get_encryption_service().encrypt(plaintext)

def decrypt_secret(encrypted_data: str) -> str:
    """Convenience function to decrypt a secret."""
    return get_encryption_service().decrypt(encrypted_data)

def is_encryption_available() -> bool:
    """Check if encryption is available."""
    try:
        return get_encryption_service().is_available()
    except Exception:
        return False
