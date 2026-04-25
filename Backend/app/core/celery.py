from celery import Celery
from celery.schedules import crontab, timedelta

from app.core.config import settings

celery_app = Celery(
    "primely",
    broker=settings.BROKER_URL,
    backend=settings.BACKEND_URL,
    include=[
        "app.tasks.scan_links_task",
        "app.tasks.expire_links_task",
        "app.tasks.cleanup_tokens_task",
        "app.tasks.click_event_task",
    ],
)
celery_app.conf.update(
    task_serializer="json",
    result_serializer="json",
    accept_content=["json"],
    timezone="UTC",
    enable_utc=True,
    worker_concurrency=4,
)


celery_app.conf.beat_schedule = {
    "scan-pending-links": {
        "task": "app.tasks.scan_links_task.scan_links_task",
        "schedule": timedelta(seconds=10),  # runs every 10 seconds
    },
    "cleanup-celery-results": {
        "task": "celery.backend_cleanup",
        "schedule": crontab(hour=0, minute=0),  # daily at midnight
    },
    "expire-links": {
        "task": "app.tasks.expire_links_task.expire_links_task",
        "schedule": timedelta(hours=1),  # every hour
    },
    "cleanup-tokens": {
        "task": "app.tasks.cleanup_tokens_task.cleanup_tokens_task",
        "schedule": crontab(hour=0, minute=0),  # daily at midnight
    },
}
