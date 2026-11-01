"""HTTP API used by the RecipAI app.

Run locally:  uvicorn app.main:app --host 0.0.0.0 --port 8300
"""

import base64
import binascii
import hmac
import logging

from fastapi import FastAPI, Header, HTTPException, Request
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import HTMLResponse

from .config import Settings, load_settings
from .demo import DemoRecipes
from .gemini import GeminiRecipes, GenerationError, RecipeGenerator
from .pages import privacy_page, support_page
from .ratelimit import RateLimiter
from .schemas import RecipeRequest, RecipeResponse

log = logging.getLogger("recipai")


def create_app(settings: Settings | None = None, generator: RecipeGenerator | None = None) -> FastAPI:
    settings = settings or load_settings()
    if generator is None and settings.demo_mode:
        generator = DemoRecipes()
    elif generator is None and settings.gemini_api_key:
        generator = GeminiRecipes(settings.gemini_api_key, settings.gemini_model, settings.gemini_timeout_seconds)
    limiter = RateLimiter(settings.rate_limit_per_hour)

    app = FastAPI(title="RecipAI", version="0.1.0")
    if settings.cors_origins:
        app.add_middleware(
            CORSMiddleware,
            allow_origins=list(settings.cors_origins),
            allow_methods=["GET", "POST"],
            allow_headers=["Content-Type", "X-RecipAI-Token"],
        )

    @app.get("/privacidad", response_class=HTMLResponse)
    def privacy() -> str:
        return privacy_page(settings.contact_email)

    @app.get("/", response_class=HTMLResponse)
    @app.get("/soporte", response_class=HTMLResponse)
    def support() -> str:
        return support_page(settings.contact_email)

    @app.get("/health")
    def health() -> dict:
        return {
            "ok": True,
            "ai_configured": generator is not None,
            "model": generator.model if generator else None,
            "token_required": bool(settings.app_token),
        }

    @app.post("/recipes", response_model=RecipeResponse)
    async def recipes(
        body: RecipeRequest,
        request: Request,
        x_recipai_token: str | None = Header(default=None),
    ) -> RecipeResponse:
        if settings.app_token and not hmac.compare_digest(x_recipai_token or "", settings.app_token):
            raise HTTPException(status_code=401, detail="invalid_token")
        if generator is None:
            raise HTTPException(status_code=503, detail="ai_not_configured")

        try:
            image = base64.b64decode(body.image_base64, validate=True)
        except (binascii.Error, ValueError):
            raise HTTPException(status_code=400, detail="invalid_image") from None
        if not image:
            raise HTTPException(status_code=400, detail="invalid_image")
        if len(image) > settings.max_image_bytes:
            raise HTTPException(status_code=413, detail="image_too_large")

        client = request.client.host if request.client else "unknown"
        if not limiter.allow(client):
            raise HTTPException(status_code=429, detail="rate_limited")

        try:
            suggestions = await generator.suggest(image, body)
        except GenerationError as exc:
            log.warning("recipe generation failed: %s", exc)
            raise HTTPException(status_code=502, detail="ai_failed") from exc

        return RecipeResponse(**suggestions.model_dump(), model=generator.model)

    return app


app = create_app()
