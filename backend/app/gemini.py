"""The Gemini call: photo + wishes in, validated RecipeSuggestions out."""

from typing import Protocol

from google import genai
from google.genai import errors, types
from pydantic import ValidationError

from .prompts import SYSTEM_PROMPT, build_user_prompt
from .schemas import RecipeRequest, RecipeSuggestions


class GenerationError(Exception):
    """Gemini failed or answered with something that is not valid recipes."""


class RecipeGenerator(Protocol):
    model: str

    async def suggest(self, image: bytes, request: RecipeRequest) -> RecipeSuggestions: ...


class GeminiRecipes:
    def __init__(self, api_key: str, model: str, timeout_seconds: int = 90):
        self.model = model
        self._client = genai.Client(
            api_key=api_key,
            http_options=types.HttpOptions(timeout=timeout_seconds * 1000),
        )

    async def suggest(self, image: bytes, request: RecipeRequest) -> RecipeSuggestions:
        try:
            response = await self._client.aio.models.generate_content(
                model=self.model,
                contents=[
                    types.Part.from_bytes(data=image, mime_type=request.mime_type),
                    build_user_prompt(request),
                ],
                config=types.GenerateContentConfig(
                    system_instruction=SYSTEM_PROMPT,
                    response_mime_type="application/json",
                    response_schema=RecipeSuggestions,
                    temperature=0.8,
                ),
            )
        except errors.APIError as exc:
            raise GenerationError(f"Gemini API error {exc.code}") from exc

        if not response.text:
            raise GenerationError("Gemini returned an empty answer")
        try:
            return RecipeSuggestions.model_validate_json(response.text)
        except ValidationError as exc:
            raise GenerationError("Gemini answer did not match the schema") from exc
