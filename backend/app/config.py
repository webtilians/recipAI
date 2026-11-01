"""Settings read from the environment (and from backend/.env when it exists)."""

import os
from dataclasses import dataclass
from pathlib import Path

from dotenv import load_dotenv

load_dotenv(Path(__file__).resolve().parent.parent / ".env")


@dataclass(frozen=True)
class Settings:
    gemini_api_key: str = ""
    gemini_model: str = "gemini-flash-lite-latest"
    # When set, every /recipes call must send it in the X-RecipAI-Token header.
    app_token: str = ""
    max_image_bytes: int = 6 * 1024 * 1024
    rate_limit_per_hour: int = 30
    gemini_timeout_seconds: int = 90
    # Canned recipes instead of Gemini, for trying the app without a key.
    demo_mode: bool = False
    # Browser origins allowed to call the API (only the web preview needs it).
    cors_origins: tuple[str, ...] = ()
    # Shown on the public privacy and support pages.
    contact_email: str = ""


def load_settings() -> Settings:
    return Settings(
        gemini_api_key=os.environ.get("GEMINI_API_KEY", "").strip(),
        gemini_model=os.environ.get("GEMINI_MODEL", "gemini-flash-lite-latest").strip(),
        app_token=os.environ.get("RECIPAI_APP_TOKEN", "").strip(),
        max_image_bytes=int(os.environ.get("RECIPAI_MAX_IMAGE_MB", "6")) * 1024 * 1024,
        rate_limit_per_hour=int(os.environ.get("RECIPAI_RATE_LIMIT_PER_HOUR", "30")),
        gemini_timeout_seconds=int(os.environ.get("RECIPAI_GEMINI_TIMEOUT_SECONDS", "90")),
        demo_mode=os.environ.get("RECIPAI_DEMO", "").strip() == "1",
        cors_origins=tuple(
            origin.strip() for origin in os.environ.get("RECIPAI_CORS_ORIGINS", "").split(",") if origin.strip()
        ),
        contact_email=os.environ.get("RECIPAI_CONTACT_EMAIL", "").strip(),
    )
