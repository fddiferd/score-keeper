#!/usr/bin/env python3
"""
Script to generate a new encryption key for the secrets service.
This should be run once and the key stored securely in environment variables.
"""

import sys
import os

# Add the src directory to the path so we can import our modules
sys.path.insert(0, os.path.join(os.path.dirname(__file__), '..', 'src'))

from services.encryption_service import EncryptionService

def main():
    """Generate and display a new encryption key."""
    print("Generating new encryption key for secrets service...")
    
    try:
        key = EncryptionService.generate_key()
        print("\n" + "="*60)
        print("ENCRYPTION KEY GENERATED SUCCESSFULLY")
        print("="*60)
        print(f"ENCRYPTION_KEY={key}")
        print("="*60)
        print("\nIMPORTANT:")
        print("1. Store this key securely in your environment variables")
        print("2. Never commit this key to version control")
        print("3. Use the same key across all instances of your application")
        print("4. If you lose this key, you will not be able to decrypt existing secrets")
        print("5. Set this as the ENCRYPTION_KEY environment variable in production")
        print("\nExample usage:")
        print("export ENCRYPTION_KEY=" + key)
        print("# or add to your .env file:")
        print("ENCRYPTION_KEY=" + key)
        print("\n")
        
    except Exception as e:
        print(f"Error generating encryption key: {e}")
        sys.exit(1)

if __name__ == "__main__":
    main()
