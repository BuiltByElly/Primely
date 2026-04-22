from uuid import uuid4

from sqlmodel import select

from app.core.security import create_access_token
from app.models.models import Links


class TestPostLinkEndpoint:
    def test_post_link_success(self, client, test_user):
        """Test successful link creation"""
        access_token = create_access_token(str(test_user.public_id))

        response = client.post(
            "/api/me/links",
            headers={"Authorization": f"Bearer {access_token}"},
            json={
                "name": "My Test Link",
                "original_link": "https://example.com",
                "lifetime": 30,
            },
        )

        data = response.json()
        assert data["status_code"] == 201
        assert data["status"] == "success"
        assert data["message"] == "Link added successfully"

    def test_post_link_status_is_scanning(self, client, test_user, session):
        """Test that newly created link has 'scanning' status by default"""
        access_token = create_access_token(str(test_user.public_id))

        response = client.post(
            "/api/me/links",
            headers={"Authorization": f"Bearer {access_token}"},
            json={
                "name": "Status Test Link",
                "original_link": "https://example.com/status",
                "lifetime": 30,
            },
        )

        data = response.json()
        assert data["status_code"] == 201

        link = session.exec(
            select(Links).where(Links.original_link == "https://example.com/status")
        ).first()

        assert link is not None
        assert link.status == "scanning"

    def test_post_link_no_authorization(self, client):
        """Test link creation without authorization header"""
        response = client.post(
            "/api/me/links",
            json={
                "name": "Unauthorized Link",
                "original_link": "https://example.com",
                "lifetime": 30,
            },
        )

        assert response.status_code == 401
        assert "Not authenticated" in response.json()["detail"]

    def test_post_link_user_not_in_database(self, client):
        """Test link creation when token is valid but user not in database"""
        fake_user_id = str(uuid4())
        access_token = create_access_token(fake_user_id)

        response = client.post(
            "/api/me/links",
            headers={"Authorization": f"Bearer {access_token}"},
            json={
                "name": "Nonexistent User Link",
                "original_link": "https://example.com",
                "lifetime": 30,
            },
        )

        assert response.status_code == 401
        assert "User not found" in response.json()["detail"]

    def test_post_link_with_complex_url(self, client, test_user, session):
        """Test link creation with complex URL"""
        access_token = create_access_token(str(test_user.public_id))
        complex_url = "https://example.com/path?param1=value1&param2=value2#section"

        response = client.post(
            "/api/me/links",
            headers={"Authorization": f"Bearer {access_token}"},
            json={
                "name": "Complex URL Link",
                "original_link": complex_url,
                "lifetime": 30,
            },
        )

        data = response.json()
        assert data["status_code"] == 201

        link = session.exec(
            select(Links).where(Links.original_link == complex_url)
        ).first()

        assert link is not None
        assert link.original_link == complex_url
