"""GeminiRecipes against a stand-in for the SDK, so no key or network is needed."""

import asyncio
from types import SimpleNamespace

import pytest
from google.genai import errors

from app.gemini import GeminiRecipes, GenerationError
from app.schemas import RecipeRequest, RecipeSuggestions

VALID_JSON = RecipeSuggestions(detected_ingredients=["arroz"], notice="", recipes=[]).model_dump_json()


def generator_answering(answer) -> tuple[GeminiRecipes, list[dict]]:
    calls: list[dict] = []

    async def generate_content(**kwargs):
        calls.append(kwargs)
        if isinstance(answer, Exception):
            raise answer
        return SimpleNamespace(text=answer)

    generator = GeminiRecipes(api_key="test-key", model="gemini-test")
    generator._client = SimpleNamespace(aio=SimpleNamespace(models=SimpleNamespace(generate_content=generate_content)))
    return generator, calls


def suggest(generator: GeminiRecipes, **request):
    return asyncio.run(generator.suggest(b"jpeg", RecipeRequest(image_base64="eA==", **request)))


def test_sends_photo_prompt_and_schema():
    generator, calls = generator_answering(VALID_JSON)
    result = suggest(generator, cuisine="India", mime_type="image/png")
    assert result.detected_ingredients == ["arroz"]

    call = calls[0]
    assert call["model"] == "gemini-test"
    photo, prompt = call["contents"]
    assert photo.inline_data.data == b"jpeg" and photo.inline_data.mime_type == "image/png"
    assert "Cuisine: India" in prompt
    assert call["config"].response_schema is RecipeSuggestions
    assert call["config"].response_mime_type == "application/json"


@pytest.mark.parametrize("answer", ["", "not json", '{"recipes": "nope"}'])
def test_unusable_answers_raise_generation_error(answer):
    generator, _ = generator_answering(answer)
    with pytest.raises(GenerationError):
        suggest(generator)


def test_api_errors_raise_generation_error():
    generator, _ = generator_answering(errors.ServerError(503, {"error": {"message": "overloaded"}}))
    with pytest.raises(GenerationError, match="503"):
        suggest(generator)
