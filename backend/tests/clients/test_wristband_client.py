import pytest
import httpx
import os
from unittest.mock import AsyncMock, patch, MagicMock
from clients.wristband_client import WristbandClient
from models.wristband.user import User, UserList


class TestWristbandApiClient:
    """Test suite for WristbandApiClient"""

    @pytest.fixture
    def mock_env(self):
        """Mock environment variables"""
        with patch.dict(os.environ, {"APPLICATION_VANITY_DOMAIN": "test-domain.wristband.dev"}):
            yield

    @pytest.fixture
    def client(self, mock_env):
        """Create a WristbandApiClient instance for testing"""
        return WristbandClient()

    @pytest.fixture
    def mock_httpx_client(self):
        """Mock httpx.AsyncClient"""
        with patch('httpx.AsyncClient') as mock_client:
            yield mock_client.return_value

    def test_init_with_valid_domain(self, mock_env):
        """Test successful initialization with valid domain"""
        client = WristbandClient()
        assert client.base_url == "https://test-domain.wristband.dev/api/v1"
        assert client.headers == {
            'Accept': 'application/json',
            'Content-Type': 'application/json'
        }

    def test_init_without_domain_raises_error(self):
        """Test initialization without APPLICATION_VANITY_DOMAIN raises ValueError"""
        with patch.dict(os.environ, {}, clear=True):
            with pytest.raises(ValueError, match="wristband_application_vanity_domain required for WristbandApiClient"):
                WristbandClient()

    # ============================================================================================
    # get_user_info tests
    # ============================================================================================
    @pytest.mark.asyncio
    async def test_get_user_info_success(self, client, mock_httpx_client):
        """Test successful get_user_info call"""
        # Arrange
        user_id = "test-user-123"
        access_token = "test-token"
        expected_response = {
            "id": user_id,
            "email": "test@example.com",
            "displayName": "Test User",
            "nickname": "testuser"
        }
        
        mock_response = MagicMock()
        mock_response.status_code = 200
        mock_response.content = b'{"id": "test-user-123", "email": "test@example.com"}'
        mock_response.json.return_value = expected_response
        
        mock_httpx_client.get = AsyncMock(return_value=mock_response)
        client.client = mock_httpx_client

        # Act
        result = await client.get_user_info(user_id, access_token)

        # Assert
        assert isinstance(result, User)
        assert result.id == user_id
        mock_httpx_client.get.assert_called_once_with(
            f"{client.base_url}/users/{user_id}",
            headers={
                **client.headers,
                'Authorization': f'Bearer {access_token}'
            }
        )

    @pytest.mark.asyncio
    async def test_get_user_info_empty_response(self, client, mock_httpx_client):
        """Test get_user_info with empty response content"""
        # Arrange
        user_id = "test-user-123"
        access_token = "test-token"
        
        mock_response = MagicMock()
        mock_response.status_code = 200
        mock_response.content = b''
        
        mock_httpx_client.get = AsyncMock(return_value=mock_response)
        client.client = mock_httpx_client

        # Act & Assert - Should raise validation error for empty User
        with pytest.raises(Exception):  # Pydantic validation error
            await client.get_user_info(user_id, access_token)

    @pytest.mark.asyncio
    async def test_get_user_info_404_error(self, client, mock_httpx_client):
        """Test get_user_info with 404 error"""
        # Arrange
        user_id = "nonexistent-user"
        access_token = "test-token"
        
        mock_response = MagicMock()
        mock_response.status_code = 404
        mock_response.text = "User not found"
        
        mock_httpx_client.get = AsyncMock(return_value=mock_response)
        client.client = mock_httpx_client

        # Act & Assert
        with pytest.raises(ValueError, match="Error calling get_user_info: 404 - User not found"):
            await client.get_user_info(user_id, access_token)

    @pytest.mark.asyncio
    async def test_get_user_info_401_unauthorized(self, client, mock_httpx_client):
        """Test get_user_info with 401 unauthorized error"""
        # Arrange
        user_id = "test-user-123"
        access_token = "invalid-token"
        
        mock_response = MagicMock()
        mock_response.status_code = 401
        mock_response.text = "Unauthorized"
        
        mock_httpx_client.get = AsyncMock(return_value=mock_response)
        client.client = mock_httpx_client

        # Act & Assert
        with pytest.raises(ValueError, match="Error calling get_user_info: 401 - Unauthorized"):
            await client.get_user_info(user_id, access_token)

    @pytest.mark.asyncio
    async def test_get_user_info_500_server_error(self, client, mock_httpx_client):
        """Test get_user_info with 500 server error"""
        # Arrange
        user_id = "test-user-123"
        access_token = "test-token"
        
        mock_response = MagicMock()
        mock_response.status_code = 500
        mock_response.text = "Internal Server Error"
        
        mock_httpx_client.get = AsyncMock(return_value=mock_response)
        client.client = mock_httpx_client

        # Act & Assert
        with pytest.raises(ValueError, match="Error calling get_user_info: 500 - Internal Server Error"):
            await client.get_user_info(user_id, access_token)

    @pytest.mark.asyncio
    async def test_get_user_info_network_error(self, client, mock_httpx_client):
        """Test get_user_info with network error"""
        # Arrange
        user_id = "test-user-123"
        access_token = "test-token"
        
        mock_httpx_client.get = AsyncMock(side_effect=httpx.NetworkError("Network error"))
        client.client = mock_httpx_client

        # Act & Assert
        with pytest.raises(httpx.NetworkError, match="Network error"):
            await client.get_user_info(user_id, access_token)

    @pytest.mark.asyncio
    async def test_get_user_info_timeout_error(self, client, mock_httpx_client):
        """Test get_user_info with timeout error"""
        # Arrange
        user_id = "test-user-123"
        access_token = "test-token"
        
        mock_httpx_client.get = AsyncMock(side_effect=httpx.TimeoutException("Request timeout"))
        client.client = mock_httpx_client

        # Act & Assert
        with pytest.raises(httpx.TimeoutException, match="Request timeout"):
            await client.get_user_info(user_id, access_token)

    @pytest.mark.asyncio
    async def test_get_user_info_with_special_characters(self, client, mock_httpx_client):
        """Test get_user_info with special characters in user_id"""
        # Arrange
        user_id = "test-user-123@domain.com"
        access_token = "test-token"
        expected_response = {"id": user_id, "email": "test@example.com"}
        
        mock_response = MagicMock()
        mock_response.status_code = 200
        mock_response.content = b'{"id": "test-user-123@domain.com"}'
        mock_response.json.return_value = expected_response
        
        mock_httpx_client.get = AsyncMock(return_value=mock_response)
        client.client = mock_httpx_client

        # Act
        result = await client.get_user_info(user_id, access_token)

        # Assert
        assert isinstance(result, User)
        assert result.id == user_id
        mock_httpx_client.get.assert_called_once_with(
            f"{client.base_url}/users/{user_id}",
            headers={
                **client.headers,
                'Authorization': f'Bearer {access_token}'
            }
        )

    @pytest.mark.asyncio
    async def test_get_user_info_with_different_token_formats(self, client, mock_httpx_client):
        """Test get_user_info with different token formats"""
        # Arrange
        user_id = "test-user-123"
        access_token = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiIxMjM0NTY3ODkwIiwibmFtZSI6IkpvaG4gRG9lIiwiaWF0IjoxNTE2MjM5MDIyfQ.SflKxwRJSMeKKF2QT4fwpMeJf36POk6yJV_adQssw5c"
        expected_response = {"id": user_id, "email": "test@example.com"}
        
        mock_response = MagicMock()
        mock_response.status_code = 200
        mock_response.content = b'{"id": "test-user-123"}'
        mock_response.json.return_value = expected_response
        
        mock_httpx_client.get = AsyncMock(return_value=mock_response)
        client.client = mock_httpx_client

        # Act
        result = await client.get_user_info(user_id, access_token)

        # Assert
        assert isinstance(result, User)
        assert result.id == user_id
        mock_httpx_client.get.assert_called_once_with(
            f"{client.base_url}/users/{user_id}",
            headers={
                **client.headers,
                'Authorization': f'Bearer {access_token}'
            }
        )

    @pytest.mark.asyncio
    async def test_get_user_info_malformed_json_response(self, client, mock_httpx_client):
        """Test get_user_info with malformed JSON response"""
        # Arrange
        user_id = "test-user-123"
        access_token = "test-token"
        
        mock_response = MagicMock()
        mock_response.status_code = 200
        mock_response.content = b'{"invalid": json}'
        mock_response.json.side_effect = ValueError("Invalid JSON")
        
        mock_httpx_client.get = AsyncMock(return_value=mock_response)
        client.client = mock_httpx_client

        # Act & Assert
        with pytest.raises(ValueError, match="Invalid JSON"):
            await client.get_user_info(user_id, access_token)

    # ============================================================================================
    # update_user_nickname tests
    # ============================================================================================
    @pytest.mark.asyncio
    async def test_update_user_nickname_success(self, client, mock_httpx_client):
        """Test successful update_user_nickname call"""
        # Arrange
        user_id = "test-user-123"
        nickname = "NewNickname"
        access_token = "test-token"
        expected_response = {
            "id": user_id,
            "email": "test@example.com",
            "nickname": nickname
        }
        
        mock_response = MagicMock()
        mock_response.status_code = 200
        mock_response.content = b'{"id": "test-user-123", "email": "test@example.com", "nickname": "NewNickname"}'
        mock_response.json.return_value = expected_response
        
        mock_httpx_client.patch = AsyncMock(return_value=mock_response)
        client.client = mock_httpx_client

        # Act
        result = await client.update_user_nickname(user_id, nickname, access_token)

        # Assert
        assert isinstance(result, User)
        assert result.nickname == nickname
        mock_httpx_client.patch.assert_called_once_with(
            f"{client.base_url}/users/{user_id}",
            headers={
                **client.headers,
                'Authorization': f'Bearer {access_token}'
            },
            json={
                'nickname': nickname
            }
        )

    @pytest.mark.asyncio
    async def test_update_user_nickname_empty_nickname(self, client, mock_httpx_client):
        """Test update_user_nickname with empty nickname"""
        # Arrange
        user_id = "test-user-123"
        nickname = ""
        access_token = "test-token"
        expected_response = {
            "id": user_id,
            "email": "test@example.com",
            "nickname": ""
        }
        
        mock_response = MagicMock()
        mock_response.status_code = 200
        mock_response.content = b'{"id": "test-user-123", "email": "test@example.com", "nickname": ""}'
        mock_response.json.return_value = expected_response
        
        mock_httpx_client.patch = AsyncMock(return_value=mock_response)
        client.client = mock_httpx_client

        # Act
        result = await client.update_user_nickname(user_id, nickname, access_token)

        # Assert
        assert isinstance(result, User)
        assert result.nickname == ""

    @pytest.mark.asyncio
    async def test_update_user_nickname_error(self, client, mock_httpx_client):
        """Test update_user_nickname with error response"""
        # Arrange
        user_id = "test-user-123"
        nickname = "NewNickname"
        access_token = "test-token"
        
        mock_response = MagicMock()
        mock_response.status_code = 400
        mock_response.text = "Bad Request"
        
        mock_httpx_client.patch = AsyncMock(return_value=mock_response)
        client.client = mock_httpx_client

        # Act & Assert
        with pytest.raises(ValueError, match="Error calling update_user_nickname: 400 - Bad Request"):
            await client.update_user_nickname(user_id, nickname, access_token)

    # ============================================================================================
    # get_user_nickname tests
    # ============================================================================================
    @pytest.mark.asyncio
    async def test_get_user_nickname_success(self, client, mock_httpx_client):
        """Test successful get_user_nickname call"""
        # Arrange
        user_id = "test-user-123"
        access_token = "test-token"
        expected_nickname = "testuser"
        user_response = {
            "id": user_id,
            "email": "test@example.com",
            "nickname": expected_nickname
        }
        
        mock_response = MagicMock()
        mock_response.status_code = 200
        mock_response.content = b'{"id": "test-user-123", "email": "test@example.com", "nickname": "testuser"}'
        mock_response.json.return_value = user_response
        
        mock_httpx_client.get = AsyncMock(return_value=mock_response)
        client.client = mock_httpx_client

        # Act
        result = await client.get_user_nickname(user_id, access_token)

        # Assert
        assert result == expected_nickname

    @pytest.mark.asyncio
    async def test_get_user_nickname_empty(self, client, mock_httpx_client):
        """Test get_user_nickname when nickname is None"""
        # Arrange
        user_id = "test-user-123"
        access_token = "test-token"
        user_response = {
            "id": user_id,
            "email": "test@example.com",
            "nickname": None
        }
        
        mock_response = MagicMock()
        mock_response.status_code = 200
        mock_response.content = b'{"id": "test-user-123", "email": "test@example.com", "nickname": null}'
        mock_response.json.return_value = user_response
        
        mock_httpx_client.get = AsyncMock(return_value=mock_response)
        client.client = mock_httpx_client

        # Act
        result = await client.get_user_nickname(user_id, access_token)

        # Assert
        assert result == ''

    # ============================================================================================
    # query_tenant_users tests
    # ============================================================================================
    @pytest.mark.asyncio
    async def test_query_tenant_users_success(self, client, mock_httpx_client):
        """Test successful query_tenant_users call"""
        # Arrange
        tenant_id = "test-tenant-123"
        access_token = "test-token"
        expected_response = {
            "items": [
                {"id": "user1", "email": "user1@example.com"},
                {"id": "user2", "email": "user2@example.com"}
            ],
            "totalResults": 2
        }
        
        mock_response = MagicMock()
        mock_response.status_code = 200
        mock_response.content = b'{"items": [{"id": "user1", "email": "user1@example.com"}, {"id": "user2", "email": "user2@example.com"}], "totalResults": 2}'
        mock_response.json.return_value = expected_response
        
        mock_httpx_client.get = AsyncMock(return_value=mock_response)
        client.client = mock_httpx_client

        # Act
        result = await client.query_tenant_users(tenant_id, access_token)

        # Assert
        assert isinstance(result, UserList)
        assert len(result.items) == 2
        assert result.totalResults == 2
        mock_httpx_client.get.assert_called_once_with(
            f"{client.base_url}/tenants/{tenant_id}/users",
            headers={
                **client.headers,
                'Authorization': f'Bearer {access_token}'
            },
            params={
                'startIndex': 0,
                'count': 10
            }
        )

    @pytest.mark.asyncio
    async def test_query_tenant_users_with_pagination(self, client, mock_httpx_client):
        """Test query_tenant_users with custom pagination"""
        # Arrange
        tenant_id = "test-tenant-123"
        access_token = "test-token"
        page = 2
        page_size = 20
        expected_response = {
            "items": [],
            "totalResults": 15
        }
        
        mock_response = MagicMock()
        mock_response.status_code = 200
        mock_response.content = b'{"items": [], "totalResults": 15}'
        mock_response.json.return_value = expected_response
        
        mock_httpx_client.get = AsyncMock(return_value=mock_response)
        client.client = mock_httpx_client

        # Act
        result = await client.query_tenant_users(tenant_id, access_token, start_index=(page-1)*page_size, count=page_size)

        # Assert
        assert isinstance(result, UserList)
        assert len(result.items) == 0
        assert result.totalResults == 15
        mock_httpx_client.get.assert_called_once_with(
            f"{client.base_url}/tenants/{tenant_id}/users",
            headers={
                **client.headers,
                'Authorization': f'Bearer {access_token}'
            },
            params={
                'startIndex': (page-1)*page_size,
                'count': page_size
            }
        )

    @pytest.mark.asyncio
    async def test_query_tenant_users_error(self, client, mock_httpx_client):
        """Test query_tenant_users with error response"""
        # Arrange
        tenant_id = "test-tenant-123"
        access_token = "test-token"
        
        mock_response = MagicMock()
        mock_response.status_code = 403
        mock_response.text = "Forbidden"
        
        mock_httpx_client.get = AsyncMock(return_value=mock_response)
        client.client = mock_httpx_client

        # Act & Assert
        with pytest.raises(ValueError, match="Error calling query_tenant_users: 403 - Forbidden"):
            await client.query_tenant_users(tenant_id, access_token)

    # ============================================================================================
    # resolve_assigned_roles_for_users tests
    # ============================================================================================
    @pytest.mark.asyncio
    async def test_resolve_assigned_roles_for_users_success(self, client, mock_httpx_client):
        """Test successful resolve_assigned_roles_for_users call"""
        # Arrange
        user_ids = ["user1", "user2", "user3"]
        access_token = "test-token"
        expected_response = {
            "user1": {
                "roles": [
                    {"roleId": "role1", "roleName": "Admin"},
                    {"roleId": "role2", "roleName": "User"}
                ]
            },
            "user2": {
                "roles": [
                    {"roleId": "role2", "roleName": "User"}
                ]
            },
            "user3": {
                "roles": []
            }
        }
        
        mock_response = MagicMock()
        mock_response.status_code = 200
        mock_response.content = b'{"user1": {"roles": [{"roleId": "role1", "roleName": "Admin"}, {"roleId": "role2", "roleName": "User"}]}, "user2": {"roles": [{"roleId": "role2", "roleName": "User"}]}, "user3": {"roles": []}}'
        mock_response.json.return_value = expected_response
        
        mock_httpx_client.post = AsyncMock(return_value=mock_response)
        client.client = mock_httpx_client

        # Act
        result = await client.resolve_assigned_roles_for_users(user_ids, access_token)

        # Assert
        assert result == expected_response
        mock_httpx_client.post.assert_called_once_with(
            f"{client.base_url}/users/resolve-assigned-roles",
            headers={
                **client.headers,
                'Authorization': f'Bearer {access_token}'
            },
            json={
                'userIds': user_ids
            }
        )

    @pytest.mark.asyncio
    async def test_resolve_assigned_roles_for_users_empty_list(self, client, mock_httpx_client):
        """Test resolve_assigned_roles_for_users with empty user list"""
        # Arrange
        user_ids = []
        access_token = "test-token"
        expected_response = {}
        
        mock_response = MagicMock()
        mock_response.status_code = 200
        mock_response.content = b'{}'
        mock_response.json.return_value = expected_response
        
        mock_httpx_client.post = AsyncMock(return_value=mock_response)
        client.client = mock_httpx_client

        # Act
        result = await client.resolve_assigned_roles_for_users(user_ids, access_token)

        # Assert
        assert result == expected_response

    @pytest.mark.asyncio
    async def test_resolve_assigned_roles_for_users_error(self, client, mock_httpx_client):
        """Test resolve_assigned_roles_for_users with error response"""
        # Arrange
        user_ids = ["user1", "user2"]
        access_token = "test-token"
        
        mock_response = MagicMock()
        mock_response.status_code = 401
        mock_response.text = "Unauthorized"
        
        mock_httpx_client.post = AsyncMock(return_value=mock_response)
        client.client = mock_httpx_client

        # Act & Assert
        with pytest.raises(ValueError, match="Error calling resolve_assigned_roles_for_users: 401 - Unauthorized"):
            await client.resolve_assigned_roles_for_users(user_ids, access_token)

    @pytest.mark.asyncio
    async def test_resolve_assigned_roles_for_users_single_user(self, client, mock_httpx_client):
        """Test resolve_assigned_roles_for_users with single user"""
        # Arrange
        user_ids = ["user1"]
        access_token = "test-token"
        expected_response = {
            "user1": {
                "roles": [
                    {"roleId": "role1", "roleName": "Admin"}
                ]
            }
        }
        
        mock_response = MagicMock()
        mock_response.status_code = 200
        mock_response.content = b'{"user1": {"roles": [{"roleId": "role1", "roleName": "Admin"}]}}'
        mock_response.json.return_value = expected_response
        
        mock_httpx_client.post = AsyncMock(return_value=mock_response)
        client.client = mock_httpx_client

        # Act
        result = await client.resolve_assigned_roles_for_users(user_ids, access_token)

        # Assert
        assert result == expected_response
        assert len(result["user1"]["roles"]) == 1
        assert result["user1"]["roles"][0]["roleName"] == "Admin" 