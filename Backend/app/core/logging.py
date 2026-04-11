import logging
from logging.handlers import RotatingFileHandler

from .config import settings

# create logger
logger = logging.getLogger("my_app")
logger.setLevel(logging.DEBUG if settings.is_prod else logging.INFO)

# console handler
console_handler = logging.StreamHandler()

console_handler.setLevel(logging.INFO)
console_formatter = logging.Formatter(
    "%(asctime)s - %(levelname)s - %(name)s - %(message)s"
)
console_handler.setFormatter(console_formatter)
logger.addHandler(console_handler)

# file handler with rotation

file_handler = RotatingFileHandler("logs/app.log", maxBytes=10_485_760, backupCount=5)

file_handler.setLevel(logging.INFO)
file_formatter = logging.Formatter(
    "%(asctime)s - %(levelname)s - %(name)s - %(message)s"
)

file_handler.setFormatter(file_formatter)
logger.addHandler(file_handler)
