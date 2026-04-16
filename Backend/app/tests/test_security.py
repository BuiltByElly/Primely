import pytest
from fastapi import HTTPException

from app.core.security import create_access_token, create_refresh_token, decode_token


class TestAccessToken:
    def test_create_access_token_contains_right_info(self):
        """Access token should contain user id and type = access and expiry date of type datetime"""
        user_id = "user_123"
        token = create_access_token(user_id)

        payload = decode_token(token)

        assert payload["sub"] == user_id
        assert payload["type"] == "access"
        assert isinstance(payload["exp"], int)


class TestRefreshToken:
    def test_create_refresh_token_contains_right_info(self):
        """Refresh token should contain user id and type = refresh and expiry date of type datetime"""
        user_id = "user_123"
        token = create_refresh_token(user_id)

        payload = decode_token(token)

        assert payload["sub"] == user_id
        assert payload["type"] == "refresh"
        assert isinstance(payload["exp"], int)


class TestDecodeToken:
    def test_decode_invalid_token_raises_error(self):
        """Invalid token should raise HTTPException"""
        invalid_token = "invalid.token.here"

        with pytest.raises(HTTPException) as exc_info:
            decode_token(invalid_token)

        assert exc_info.value.status_code == 401

    def test_decode_wrong_token_type_raises_error(self):
        """Decoding with wrong token type should raise error"""
        access_token = create_access_token("user-123")

        with pytest.raises(HTTPException) as exc_info:
            decode_token(access_token, token_type="refresh")

        assert exc_info.value.status_code == 401
        assert "Invalid token type" in exc_info.value.detail
