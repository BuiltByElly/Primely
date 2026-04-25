import pytest
from fastapi import HTTPException

from app.models.models import Users
from app.services.authentication import AuthService


class TestAuthenticateUser:
    def test_authenticate_user_success(self, session, test_user):
        auth_service = AuthService(session)

        password, email = ("123456", "e@g.com")
        user = auth_service.authenticate_user(password, email)
        assert user is not None

    def test_authenticate_user_with_wrong_email(self, session, test_user):
        auth_service = AuthService(session)

        password = "123456"
        user = auth_service.authenticate_user(password, "wrong_email@g.com")
        assert user is None

    def test_authenticate_user_with_wrong_password(self, session, test_user):
        auth_service = AuthService(session)
        user = auth_service.authenticate_user("123789", "e@g.com")
        assert user is None


class TestValidation:
    def test_validate_for_register_with_success(self, session, test_user_credentials):
        auth_service = AuthService(session)

        result = auth_service.validate_for_register(
            test_user_credentials["username"],
            test_user_credentials["password"],
            test_user_credentials["email"],
        )
        assert result is True

    def test_validate_for_register_with_failure(self, session, test_user_credentials):
        auth_service = AuthService(session)

        with pytest.raises(HTTPException) as exec:
            auth_service.validate_for_register(
                "",
                "",
                "2.com",
            )
        assert exec.value.status_code == 400

    def test_validate_for_register_with_unavailable_email(
        self, session, test_user_credentials, test_user
    ):
        auth_service = AuthService(session)

        with pytest.raises(HTTPException) as exec:
            auth_service.validate_for_register(
                test_user_credentials["username"],
                test_user_credentials["password"],
                test_user_credentials["email"],
            )
        assert exec.value.status_code == 400

    def test_validate_for_login_with_success(self, session, test_user_credentials):
        auth_service = AuthService(session)

        result = auth_service.validate_for_login(
            test_user_credentials["password"],
            test_user_credentials["email"],
        )
        assert result is True

    def test_validate_for_login_with_failure(self, session, test_user_credentials):
        auth_service = AuthService(session)

        with pytest.raises(HTTPException) as exec:
            auth_service.validate_for_login(
                "",
                "2.com",
            )
        assert exec.value.status_code == 401


class TestRegisterUser:
    def test_register_user_success(self, session, test_user_credentials):
        auth_service = AuthService(session)

        result = auth_service.register_user(
            test_user_credentials["username"],
            test_user_credentials["password"],
            test_user_credentials["email"],
        )
        assert isinstance(result, Users)
