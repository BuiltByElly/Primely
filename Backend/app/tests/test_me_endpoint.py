from uuid import uuid4

from app.core.security import create_access_token
from app.models.models import Users


class TestMeEndpoint:
    def test_get_me_success(self, client, test_user):
        """Test successful retrieval of current user information"""
        access_token = create_access_token(str(test_user.public_id))

        response = client.get(
            "/api/me", headers={"Authorization": f"Bearer {access_token}"}
        )

        assert response.status_code == 200
        data = response.json()
        assert data["public_id"] == str(test_user.public_id)
        assert data["username"] == test_user.username
        assert data["email"] == test_user.email

    def test_get_me_no_authorization_header(self, client):
        """Test /me endpoint without authorization header"""
        response = client.get("/api/me")

        assert response.status_code == 401
        assert "Not authenticated" in response.json()["detail"]

    def test_get_me_invalid_token(self, client):
        """Test /me endpoint with invalid access token"""
        response = client.get(
            "/api/me", headers={"Authorization": "Bearer invalid.token.here"}
        )

        assert response.status_code == 401

    def test_get_me_wrong_token_type(self, client, test_user):
        """Test /me endpoint with refresh token instead of access token"""
        from app.core.security import create_refresh_token

        refresh_token = create_refresh_token(str(test_user.public_id))

        response = client.get(
            "/api/me", headers={"Authorization": f"Bearer {refresh_token}"}
        )

        assert response.status_code == 401

    def test_get_me_user_not_found_in_db(self, client):
        """Test /me endpoint when user exists in token but not in database"""
        fake_user_id = str(uuid4())
        access_token = create_access_token(fake_user_id)

        response = client.get(
            "/api/me", headers={"Authorization": f"Bearer {access_token}"}
        )

        assert response.status_code == 403
        assert "User not found" in response.json()["detail"]

    def test_get_me_multiple_users(self, client, session):
        """Test that /me returns correct user when multiple users exist"""
        from uuid import uuid4

        from app.core.security import hash_password

        # Create second user
        user2 = Users(
            public_id=uuid4(),
            username="anotheruser",
            password=hash_password("password123"),
            email="another@example.com",
        )
        session.add(user2)
        session.commit()

        # Get token for second user
        access_token = create_access_token(str(user2.public_id))

        response = client.get(
            "/api/me", headers={"Authorization": f"Bearer {access_token}"}
        )

        assert response.status_code == 200
        data = response.json()

        # Verify we get the second user's data
        assert data["public_id"] == str(user2.public_id)
        assert data["username"] == "anotheruser"
        assert data["email"] == "another@example.com"

    def test_get_me_malformed_authorization_header(self, client):
        """Test /me endpoint with malformed authorization header"""
        response = client.get("/api/me", headers={"Authorization": "InvalidFormat"})

        assert response.status_code == 401

    def test_get_me_empty_authorization_header(self, client):
        """Test /me endpoint with empty authorization header"""
        response = client.get("/api/me", headers={"Authorization": ""})

        assert response.status_code == 401
