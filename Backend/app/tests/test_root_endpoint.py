from app.core.security import create_access_token


class TestRootEndpoint:
    def test_me_success(self, client, test_user):
        """Test getting current user information"""
        token = create_access_token(str(test_user.public_id))

        client.headers = {"Authorization": f"Bearer {token}"}
        response = client.get("/api/me")

        assert response.status_code == 200
        data = response.json()
        assert data["public_id"] == str(test_user.public_id)
        assert data["username"] == test_user.username
        assert data["email"] == test_user.email

    def test_me_no_token(self, client):
        """Test that endpoint requires authentication"""
        response = client.get("/api/me")

        assert response.status_code == 401

    def test_me_invalid_token(self, client):
        """Test with invalid token"""
        client.headers = {"Authorization": "Bearer invalid.token.here"}
        response = client.get("/api/me")

        assert response.status_code == 401
