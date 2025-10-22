"""
Shared test fixtures and configuration for the test suite.
"""

import pytest
import os
from unittest.mock import patch



@pytest.fixture(scope="session")
def test_env():
    """Session-scoped fixture for test environment variables"""
    test_env_vars = {
        "APPLICATION_VANITY_DOMAIN": "test-domain.wristband.dev",
        "ENVIRONMENT": "test"
    }
    
    with patch.dict(os.environ, test_env_vars):
        yield test_env_vars


@pytest.fixture
def sample_user_data():
    """Sample user data for testing"""
    return {
        "id": "test-user-123",
        "email": "test@example.com",
        "displayName": "Test User",
        "nickname": "testuser",
        "createdAt": "2023-01-01T00:00:00Z",
        "updatedAt": "2023-01-01T00:00:00Z"
    }


@pytest.fixture
def sample_access_token():
    """Sample access token for testing"""
    return "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiIxMjM0NTY3ODkwIiwibmFtZSI6IkpvaG4gRG9lIiwiaWF0IjoxNTE2MjM5MDIyfQ.SflKxwRJSMeKKF2QT4fwpMeJf36POk6yJV_adQssw5c"


@pytest.fixture
def sample_user_id():
    """Sample user ID for testing"""
    return "test-user-123" 