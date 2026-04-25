from datetime import datetime, timedelta, timezone
from unittest.mock import MagicMock, patch
from uuid import uuid4

import pytest
from sqlmodel import select

from app.core.security import hash_password
from app.models.models import Links, Users
from app.tasks.scan_links_task import scan_links_task


def run_scan_links_task():
    scan_links_task.run()  # type: ignore[attr-defined]


@pytest.fixture
def test_user_with_links(session):
    """Create a test user with multiple scanning links"""
    user = Users(
        public_id=uuid4(),
        username="linkuser",
        password=hash_password("password123"),
        email="linkuser@example.com",
    )
    session.add(user)
    session.commit()

    # Create multiple scanning links
    links = []
    for i in range(3):
        link = Links(
            user_id=user.id,
            name=f"Test Link {i}",
            original_link=f"https://example.com/link{i}",
            status="scanning",
            expires_at=datetime.now(timezone.utc) + timedelta(days=30),
        )
        links.append(link)
        session.add(link)
    session.commit()

    return user, links


class TestScanLinksTask:
    def test_scan_links_task_no_scanning_links(self, session):
        """Test task execution when there are no scanning links"""
        with patch("app.tasks.scan_links_task.Session") as mock_session_class:
            with patch("app.tasks.scan_links_task.scan_links") as mock_scan:
                mock_session_instance = MagicMock()
                mock_session_instance.__enter__.return_value = session
                mock_session_instance.__exit__.return_value = None
                mock_session_class.return_value = mock_session_instance

                run_scan_links_task()

                # scan_links should not be called if there are no scanning links
                mock_scan.assert_not_called()

    def test_scan_links_task_all_safe_links(self, session, test_user_with_links):
        """Test task execution when all links are safe"""
        user, links = test_user_with_links

        with patch("app.tasks.scan_links_task.Session") as mock_session_class:
            with patch("app.tasks.scan_links_task.scan_links") as mock_scan:
                mock_session_instance = MagicMock()
                mock_session_instance.__enter__.return_value = session
                mock_session_instance.__exit__.return_value = None
                mock_session_class.return_value = mock_session_instance

                mock_scan.return_value = []  # No malicious links

                run_scan_links_task()

                # Verify scan_links was called with correct URLs
                mock_scan.assert_called_once()
                call_args = mock_scan.call_args[0][0]
                assert len(call_args) == len(links)
                for link in links:
                    assert link.original_link in call_args

                # Verify all links are now active
                updated_links = session.exec(select(Links)).all()
                for link in updated_links:
                    assert link.status == "active"
                    assert link.short_code is not None

    def test_scan_links_task_all_malicious_links(self, session, test_user_with_links):
        """Test task execution when all links are malicious"""
        user, links = test_user_with_links

        with patch("app.tasks.scan_links_task.Session") as mock_session_class:
            with patch("app.tasks.scan_links_task.scan_links") as mock_scan:
                mock_session_instance = MagicMock()
                mock_session_instance.__enter__.return_value = session
                mock_session_instance.__exit__.return_value = None
                mock_session_class.return_value = mock_session_instance

                # Mark all links as malicious
                malicious_urls = [link.original_link for link in links]
                mock_scan.return_value = malicious_urls

                run_scan_links_task()

                # Verify all links are marked as malicious
                updated_links = session.exec(select(Links)).all()
                for link in updated_links:
                    assert link.status == "malicious"
                    assert link.short_code is None

    def test_scan_links_task_mixed_safe_and_malicious(
        self, session, test_user_with_links
    ):
        """Test task execution with both safe and malicious links"""
        user, links = test_user_with_links

        with patch("app.tasks.scan_links_task.Session") as mock_session_class:
            with patch("app.tasks.scan_links_task.scan_links") as mock_scan:
                mock_session_instance = MagicMock()
                mock_session_instance.__enter__.return_value = session
                mock_session_instance.__exit__.return_value = None
                mock_session_class.return_value = mock_session_instance

                # First and third links are malicious
                malicious_urls = [links[0].original_link, links[2].original_link]
                mock_scan.return_value = malicious_urls

                run_scan_links_task()

                # Verify malicious links are marked correctly
                updated_links = session.exec(select(Links)).all()
                assert updated_links[0].status == "malicious"
                assert updated_links[0].short_code is None

                # Verify safe link is marked correctly
                assert updated_links[1].status == "active"
                assert updated_links[1].short_code is not None

                assert updated_links[2].status == "malicious"
                assert updated_links[2].short_code is None

    def test_scan_links_task_unknown_exception_failure(
        self, session, test_user_with_links
    ):
        """Test task handles unknown exceptions by marking links as failed"""
        user, links = test_user_with_links

        with patch("app.tasks.scan_links_task.Session") as mock_session_class:
            with patch("app.tasks.scan_links_task.scan_links") as mock_scan:
                mock_session_instance = MagicMock()
                mock_session_instance.__enter__.return_value = session
                mock_session_instance.__exit__.return_value = None
                mock_session_class.return_value = mock_session_instance

                # Simulate unexpected error
                mock_error = ValueError("Unexpected error")
                mock_scan.side_effect = mock_error

                with pytest.raises(ValueError):
                    run_scan_links_task()

                session.rollback()
                # Verify all links are marked as failed
                updated_links = session.exec(select(Links)).all()
                for link in updated_links:
                    assert link.status == "failed"

    def test_scan_links_task_short_code_generation(self, session, test_user_with_links):
        """Test that short codes are generated correctly for safe links"""
        user, links = test_user_with_links

        with patch("app.tasks.scan_links_task.Session") as mock_session_class:
            with patch("app.tasks.scan_links_task.scan_links") as mock_scan:
                with patch(
                    "app.tasks.scan_links_task.generate_unique_short_code"
                ) as mock_generate:
                    mock_session_instance = MagicMock()
                    mock_session_instance.__enter__.return_value = session
                    mock_session_instance.__exit__.return_value = None
                    mock_session_class.return_value = mock_session_instance

                    mock_scan.return_value = []  # All safe
                    mock_generate.side_effect = ["ABC123", "DEF456", "GHI789"]

                    run_scan_links_task()

                    # Verify generate_unique_short_code was called for each link
                    assert mock_generate.call_count == len(links)

                    updated_links = session.exec(select(Links)).all()
                    assert updated_links[0].short_code == "ABC123"
                    assert updated_links[1].short_code == "DEF456"
                    assert updated_links[2].short_code == "GHI789"

    def test_scan_links_task_empty_scanning_list(self, session):
        """Test task handles empty scanning list gracefully"""
        # Create user but no links
        user = Users(
            public_id=uuid4(),
            username="nolinks",
            password=hash_password("password"),
            email="nolinks@example.com",
        )
        session.add(user)
        session.commit()

        with patch("app.tasks.scan_links_task.Session") as mock_session_class:
            with patch("app.tasks.scan_links_task.scan_links") as mock_scan:
                mock_session_instance = MagicMock()
                mock_session_instance.__enter__.return_value = session
                mock_session_instance.__exit__.return_value = None
                mock_session_class.return_value = mock_session_instance

                run_scan_links_task()

                # scan_links should not be called
                mock_scan.assert_not_called()

    def test_scan_links_task_partial_failure(self, session, test_user_with_links):
        """Test task handles partial failures during short code generation"""
        user, links = test_user_with_links

        with patch("app.tasks.scan_links_task.Session") as mock_session_class:
            with patch("app.tasks.scan_links_task.scan_links") as mock_scan:
                with patch(
                    "app.tasks.scan_links_task.generate_unique_short_code"
                ) as mock_generate:
                    mock_session_instance = MagicMock()
                    mock_session_instance.__enter__.return_value = session
                    mock_session_instance.__exit__.return_value = None
                    mock_session_class.return_value = mock_session_instance

                    mock_scan.return_value = []

                    # Fail on second link
                    mock_generate.side_effect = [
                        "ABC123",
                        Exception("Generation failed"),
                        "GHI789",
                    ]

                    with pytest.raises(Exception):
                        run_scan_links_task()

                    session.rollback()
                    # All links should be marked as failed since exception occurred
                    updated_links = session.exec(select(Links)).all()
                    for link in updated_links:
                        assert link.status == "failed"
