from datetime import datetime, timedelta, timezone

from sqlmodel import select

from app.core.config import settings
from app.core.security import create_access_token, create_refresh_token, hash_token
from app.models.models import RefreshTokens, Users


class TestRegisterEndpoint:
    def test_register_success(self, client):
        """Test successful user registration"""
        response = client.post(
            "/api/auth/register",
            json={
                "username": "newuser",
                "password": "newpassword123",
                "email": "newuser@example.com",
            },
        )

        assert response.status_code == 200
        assert response.json()["success"] is True
        assert response.json()["message"] == "Registered successfully"
        assert "access_token" in response.json()
        assert response.cookies.get("refresh_token") is not None

    def test_register_empty_username(self, client):
        """Test registration with empty username"""
        response = client.post(
            "/api/auth/register",
            json={
                "username": "",
                "password": "password123",
                "email": "test@example.com",
            },
        )

        assert response.status_code == 400
        assert "Username" in response.json()["detail"]

    def test_register_username_too_long(self, client):
        """Test registration with username exceeding 25 characters"""
        response = client.post(
            "/api/auth/register",
            json={
                "username": "a" * 26,
                "password": "password123",
                "email": "test@example.com",
            },
        )

        assert response.status_code == 400
        assert "25 characters" in response.json()["detail"]

    def test_register_empty_password(self, client):
        """Test registration with empty password"""
        response = client.post(
            "/api/auth/register",
            json={"username": "testuser", "password": "", "email": "test@example.com"},
        )

        assert response.status_code == 400
        assert "Password" in response.json()["detail"]

    def test_register_invalid_email(self, client):
        """Test registration with invalid email format"""
        response = client.post(
            "/api/auth/register",
            json={
                "username": "testuser",
                "password": "password123",
                "email": "not-an-email",
            },
        )

        assert response.status_code == 400
        assert "Not an email" in response.json()["detail"]

    def test_register_email_already_exists(self, client, test_user):
        """Test registration with email that already exists"""
        response = client.post(
            "/api/auth/register",
            json={
                "username": "differentuser",
                "password": "password123",
                "email": "e@g.com",
            },
        )

        assert response.status_code == 400
        assert "not available" in response.json()["detail"]

    def test_register_creates_user_in_database(self, client, session):
        """Test that registered user is actually created in database"""
        response = client.post(
            "/api/auth/register",
            json={
                "username": "dbuser",
                "password": "dbpass123",
                "email": "dbuser@example.com",
            },
        )

        assert response.status_code == 200

        user = session.exec(select(Users).where(Users.username == "dbuser")).first()

        assert user is not None
        assert user.email == "dbuser@example.com"


class TestLoginEndpoint:
    def test_login_success(self, client, test_user):
        """Test successful login with existing user"""
        response = client.post(
            "/api/auth/login",
            json={"password": "123456", "email": "e@g.com"},
        )

        assert response.status_code == 200
        assert response.json()["success"] is True
        assert response.json()["message"] == "Logged in successfully"
        assert "access_token" in response.json()
        assert response.cookies.get("refresh_token") is not None

    def test_login_wrong_password(self, client, test_user):
        """Test login with wrong password"""
        response = client.post(
            "/api/auth/login",
            json={"password": "wrongpassword", "email": "e@g.com"},
        )

        assert response.status_code == 401
        assert "Invalid credentials" in response.json()["detail"]

    def test_login_wrong_email(self, client, test_user):
        """Test login with wrong email"""
        response = client.post(
            "/api/auth/login",
            json={
                "password": "123456",
                "email": "wrong@example.com",
            },
        )

        assert response.status_code == 401
        assert "Invalid credentials" in response.json()["detail"]

    def test_login_nonexistent_user(self, client):
        """Test login with nonexistent user"""
        response = client.post(
            "/api/auth/login",
            json={
                "password": "password123",
                "email": "nonexistent@example.com",
            },
        )

        assert response.status_code == 401
        assert "Invalid credentials" in response.json()["detail"]

    def test_login_empty_password(self, client):
        """Test login with empty password"""
        response = client.post(
            "/api/auth/login",
            json={"password": "", "email": "test@example.com"},
        )

        assert response.status_code == 401
        assert "Password" in response.json()["detail"]

    def test_login_invalid_email_format(self, client):
        """Test login with invalid email format"""
        response = client.post(
            "/api/auth/login",
            json={
                "password": "password123",
                "email": "not-an-email",
            },
        )

        assert response.status_code == 401
        assert "Not an email" in response.json()["detail"]

    def test_login_creates_refresh_token_in_db(self, client, test_user, session):
        """Test that login creates refresh token in database"""
        initial_tokens = session.exec(select(RefreshTokens)).all()
        initial_count = len(initial_tokens)

        response = client.post(
            "/api/auth/login",
            json={"password": "123456", "email": "e@g.com"},
        )

        assert response.status_code == 200

        tokens = session.exec(select(RefreshTokens)).all()
        assert len(tokens) > initial_count


class TestRefreshEndpoint:
    def test_refresh_success(self, client, test_user, session, test_user_credentials):
        """Test successful token refresh"""
        refresh_token = create_refresh_token(str(test_user.public_id))
        token_hash = hash_token(refresh_token)

        expires_at = datetime.now(timezone.utc) + timedelta(
            days=settings.REFRESH_TOKEN_EXPIRE_DAYS
            if test_user_credentials["remember_me"]
            else settings.REFRESH_TOKEN_EXPIRE_DAY
        )

        db_token = RefreshTokens(
            token_hash=token_hash,
            user_id=test_user.id or 0,
            created_at=datetime.now(timezone.utc),
            expires_at=expires_at,
            revoked=False,
        )
        session.add(db_token)
        session.commit()

        client.cookies.set("refresh_token", refresh_token)
        response = client.post("/api/auth/refresh")

        assert response.status_code == 200
        assert response.json()["success"] is True
        assert "access_token" in response.json()
        assert response.cookies.get("refresh_token") is not None

    def test_refresh_no_token(self, client):
        """Test refresh without refresh token"""
        response = client.post("/api/auth/refresh")

        assert response.status_code == 401
        assert "Not authorized" in response.json()["detail"]

    def test_refresh_invalid_token(self, client):
        """Test refresh with invalid refresh token"""
        client.cookies.set("refresh_token", "invalid.token.here")
        response = client.post("/api/auth/refresh")

        assert response.status_code == 401

    def test_refresh_revoked_token(self, client, test_user, session):
        """Test refresh with revoked token"""
        refresh_token = create_refresh_token(str(test_user.public_id))
        token_hash = hash_token(refresh_token)

        expires_at = datetime.now(timezone.utc) + timedelta(
            days=settings.REFRESH_TOKEN_EXPIRE_DAYS
        )
        db_token = RefreshTokens(
            token_hash=token_hash,
            user_id=test_user.id or 0,
            created_at=datetime.now(timezone.utc),
            expires_at=expires_at,
            revoked=True,
        )
        session.add(db_token)
        session.commit()

        client.cookies.set("refresh_token", refresh_token)
        response = client.post("/api/auth/refresh")

        assert response.status_code == 401
        assert "Invalid Refresh Token" in response.json()["detail"]


class TestLogoutEndpoint:
    def test_logout_success(self, client, test_user, session):
        """Test successful logout"""
        refresh_token = create_refresh_token(str(test_user.public_id))
        token_hash = hash_token(refresh_token)

        expires_at = datetime.now(timezone.utc) + timedelta(
            days=settings.REFRESH_TOKEN_EXPIRE_DAYS
        )
        db_token = RefreshTokens(
            token_hash=token_hash,
            user_id=test_user.id or 0,
            created_at=datetime.now(timezone.utc),
            expires_at=expires_at,
            revoked=False,
        )
        session.add(db_token)
        session.commit()

        access_token = create_access_token(str(test_user.public_id))

        client.cookies.set("refresh_token", refresh_token)
        response = client.delete(
            "/api/auth/logout", headers={"Authorization": f"Bearer {access_token}"}
        )

        assert response.status_code == 200
        assert response.json()["success"] is True
        assert response.json()["message"] == "Logged out successfully"

    def test_logout_no_token(self, client):
        """Test logout without access token"""
        response = client.delete("/api/auth/logout")

        assert response.status_code == 401

    def test_logout_no_refresh_token(self, client, test_user):
        """Test logout without refresh token in cookies"""
        access_token = create_access_token(str(test_user.public_id))

        response = client.delete(
            "/api/auth/logout", headers={"Authorization": f"Bearer {access_token}"}
        )

        assert response.status_code == 400
        assert "Refresh token not found" in response.json()["detail"]

    def test_logout_revokes_token(self, client, test_user, session):
        """Test that logout marks token as revoked"""
        refresh_token = create_refresh_token(str(test_user.public_id))
        token_hash = hash_token(refresh_token)

        expires_at = datetime.now(timezone.utc) + timedelta(
            days=settings.REFRESH_TOKEN_EXPIRE_DAYS
        )
        db_token = RefreshTokens(
            token_hash=token_hash,
            user_id=test_user.id or 0,
            created_at=datetime.now(timezone.utc),
            expires_at=expires_at,
            revoked=False,
        )
        session.add(db_token)
        session.commit()

        access_token = create_access_token(str(test_user.public_id))

        client.cookies.set("refresh_token", refresh_token)
        response = client.delete(
            "/api/auth/logout", headers={"Authorization": f"Bearer {access_token}"}
        )

        assert response.status_code == 200

        revoked_token = session.exec(
            select(RefreshTokens).where(RefreshTokens.token_hash == token_hash)
        ).first()

        assert revoked_token is not None
        assert revoked_token.revoked is True
