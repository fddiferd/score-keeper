import pytest
import os
from unittest.mock import patch
from services.encryption_service import EncryptionService, encrypt_secret, decrypt_secret, is_encryption_available


class TestEncryptionService:
    """Test cases for the encryption service."""
    
    def test_encrypt_decrypt_cycle(self):
        """Test that encryption and decryption work correctly."""
        service = EncryptionService()
        
        # Test data
        original_text = "my-super-secret-api-key-12345"
        
        # Encrypt the text
        encrypted = service.encrypt(original_text)
        
        # Verify it's different from original
        assert encrypted != original_text
        assert len(encrypted) > 0
        
        # Decrypt and verify it matches original
        decrypted = service.decrypt(encrypted)
        assert decrypted == original_text
    
    def test_encrypt_different_inputs_produce_different_outputs(self):
        """Test that different inputs produce different encrypted outputs."""
        service = EncryptionService()
        
        text1 = "secret-key-1"
        text2 = "secret-key-2"
        
        encrypted1 = service.encrypt(text1)
        encrypted2 = service.encrypt(text2)
        
        assert encrypted1 != encrypted2
    
    def test_same_input_produces_different_outputs(self):
        """Test that the same input produces different encrypted outputs (due to randomness)."""
        service = EncryptionService()
        
        text = "my-secret-key"
        
        encrypted1 = service.encrypt(text)
        encrypted2 = service.encrypt(text)
        
        # Should be different due to Fernet's built-in randomness
        assert encrypted1 != encrypted2
        
        # But both should decrypt to the same original text
        assert service.decrypt(encrypted1) == text
        assert service.decrypt(encrypted2) == text
    
    def test_convenience_functions(self):
        """Test the convenience functions work correctly."""
        original_text = "test-secret-value"
        
        # Test encryption convenience function
        encrypted = encrypt_secret(original_text)
        assert encrypted != original_text
        
        # Test decryption convenience function
        decrypted = decrypt_secret(encrypted)
        assert decrypted == original_text
    
    def test_is_encryption_available(self):
        """Test that encryption availability check works."""
        assert is_encryption_available() is True
    
    def test_service_is_available(self):
        """Test that service availability check works."""
        service = EncryptionService()
        assert service.is_available() is True
    
    def test_generate_key(self):
        """Test that key generation works."""
        key = EncryptionService.generate_key()
        assert isinstance(key, str)
        assert len(key) > 0
        # Fernet keys are 44 characters when base64 encoded
        assert len(key) == 44
    
    def test_empty_string_encryption(self):
        """Test that empty strings can be encrypted and decrypted."""
        service = EncryptionService()
        
        original = ""
        encrypted = service.encrypt(original)
        decrypted = service.decrypt(encrypted)
        
        assert decrypted == original
    
    def test_unicode_string_encryption(self):
        """Test that unicode strings can be encrypted and decrypted."""
        service = EncryptionService()
        
        original = "🔐 Secret émojis and spëcial chars! 中文"
        encrypted = service.encrypt(original)
        decrypted = service.decrypt(encrypted)
        
        assert decrypted == original
    
    def test_long_string_encryption(self):
        """Test that long strings can be encrypted and decrypted."""
        service = EncryptionService()
        
        # Create a long string
        original = "a" * 10000
        encrypted = service.encrypt(original)
        decrypted = service.decrypt(encrypted)
        
        assert decrypted == original
    
    @patch.dict(os.environ, {'ENCRYPTION_KEY': 'test-key-for-testing-purposes-only-123'})
    def test_custom_encryption_key(self):
        """Test that custom encryption keys work."""
        service = EncryptionService()
        
        original = "test-with-custom-key"
        encrypted = service.encrypt(original)
        decrypted = service.decrypt(encrypted)
        
        assert decrypted == original
    
    def test_invalid_decryption_raises_error(self):
        """Test that invalid encrypted data raises an error."""
        service = EncryptionService()
        
        with pytest.raises(RuntimeError, match="Failed to decrypt data"):
            service.decrypt("invalid-encrypted-data")
    
    def test_empty_decryption_raises_error(self):
        """Test that empty encrypted data raises an error."""
        service = EncryptionService()
        
        with pytest.raises(RuntimeError, match="Failed to decrypt data"):
            service.decrypt("")
