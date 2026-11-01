import base64

import pytest
from fastapi.testclient import TestClient

from app.gemini import GenerationError
from app.config import Settings
from app.main import create_app
from app.prompts import build_user_prompt
from app.ratelimit import RateLimiter
from app.schemas import Ingredient, Recipe, RecipeRequest, RecipeSuggestions

PHOTO = base64.b64encode(b"\xff\xd8\xff fake jpeg bytes").decode()

SUGGESTIONS = RecipeSuggestions(
    detected_ingredients=["tomate", "huevos", "cebolla"],
    notice="",
    recipes=[
        Recipe(
            title="Shakshuka",
            cuisine="Mediterránea",
            summary="Huevos escalfados en salsa de tomate especiada.",
            minutes=30,
            difficulty="easy",
            servings=2,
            ingredients=[
                Ingredient(name="tomate", quantity="4 unidades", in_photo=True),
                Ingredient(name="comino", quantity="1 cucharadita", in_photo=False),
            ],
            steps=["Sofríe la cebolla 5 minutos.", "Añade el tomate.", "Casca los huevos.", "Tapa 6 minutos."],
            tip="",
        )
    ],
)


class FakeGenerator:
    model = "fake-model"

    def __init__(self, result=SUGGESTIONS, error: Exception | None = None):
        self.result = result
        self.error = error
        self.calls: list[tuple[bytes, RecipeRequest]] = []

    async def suggest(self, image, request):
        self.calls.append((image, request))
        if self.error:
            raise self.error
        return self.result


def make_client(generator=None, **settings) -> TestClient:
    return TestClient(create_app(Settings(**settings), generator=generator))


def test_health_reports_ai_and_token_state():
    body = make_client(FakeGenerator(), app_token="secret").get("/health").json()
    assert body == {"ok": True, "ai_configured": True, "model": "fake-model", "token_required": True}


def test_recipes_returns_suggestions_and_passes_the_wishes():
    generator = FakeGenerator()
    response = make_client(generator).post(
        "/recipes", json={"image_base64": PHOTO, "cuisine": "Mexicana", "notes": "sin gluten"}
    )
    assert response.status_code == 200
    body = response.json()
    assert body["model"] == "fake-model"
    assert body["recipes"][0]["title"] == "Shakshuka"
    image, request = generator.calls[0]
    assert image.startswith(b"\xff\xd8\xff")
    assert (request.cuisine, request.notes, request.language, request.count) == ("Mexicana", "sin gluten", "es", 3)


def test_missing_ai_key_is_503():
    response = make_client(None).post("/recipes", json={"image_base64": PHOTO})
    assert response.status_code == 503
    assert response.json()["detail"] == "ai_not_configured"


@pytest.mark.parametrize("token, status", [(None, 401), ("wrong", 401), ("secret", 200)])
def test_app_token_is_enforced(token, status):
    headers = {"X-RecipAI-Token": token} if token else {}
    response = make_client(FakeGenerator(), app_token="secret").post(
        "/recipes", json={"image_base64": PHOTO}, headers=headers
    )
    assert response.status_code == status


def test_bad_base64_is_400():
    response = make_client(FakeGenerator()).post("/recipes", json={"image_base64": "not base64!!"})
    assert response.status_code == 400


def test_image_over_the_limit_is_413():
    big = base64.b64encode(b"x" * 2048).decode()
    response = make_client(FakeGenerator(), max_image_bytes=1024).post("/recipes", json={"image_base64": big})
    assert response.status_code == 413


def test_unsupported_mime_type_is_rejected():
    response = make_client(FakeGenerator()).post("/recipes", json={"image_base64": PHOTO, "mime_type": "image/gif"})
    assert response.status_code == 422


def test_rate_limit_is_429():
    client = make_client(FakeGenerator(), rate_limit_per_hour=2)
    codes = [client.post("/recipes", json={"image_base64": PHOTO}).status_code for _ in range(3)]
    assert codes == [200, 200, 429]


def test_generation_error_is_502():
    response = make_client(FakeGenerator(error=GenerationError("boom"))).post("/recipes", json={"image_base64": PHOTO})
    assert response.status_code == 502
    assert response.json()["detail"] == "ai_failed"


def test_demo_mode_answers_without_a_key_and_keeps_the_cuisine():
    client = make_client(None, demo_mode=True)
    assert client.get("/health").json()["model"] == "demo"
    body = client.post("/recipes", json={"image_base64": PHOTO, "cuisine": "Griega"}).json()
    assert body["model"] == "demo"
    assert body["recipes"] and all(recipe["cuisine"] == "Griega" for recipe in body["recipes"])


def test_cors_is_off_unless_origins_are_configured():
    preflight = {"Origin": "http://localhost:8081", "Access-Control-Request-Method": "POST"}
    closed = make_client(FakeGenerator()).options("/recipes", headers=preflight)
    assert "access-control-allow-origin" not in closed.headers
    open_ = make_client(FakeGenerator(), cors_origins=("http://localhost:8081",)).options("/recipes", headers=preflight)
    assert open_.headers["access-control-allow-origin"] == "http://localhost:8081"


@pytest.mark.parametrize("path, text", [("/privacidad", "Gemini"), ("/soporte", "Preguntas frecuentes"), ("/", "Soporte")])
def test_public_pages_show_the_contact(path, text):
    response = make_client(FakeGenerator(), contact_email="hola@example.com").get(path)
    assert response.status_code == 200
    assert response.headers["content-type"].startswith("text/html")
    assert text in response.text
    assert "mailto:hola@example.com" in response.text


def test_pages_fall_back_to_github_without_an_email():
    page = make_client(FakeGenerator()).get("/privacidad").text
    assert "mailto:" not in page
    assert "github.com/webtilians/recipAI/issues" in page


def test_rate_limiter_forgets_after_an_hour():
    now = [0.0]
    limiter = RateLimiter(per_hour=1, clock=lambda: now[0])
    assert limiter.allow("a")
    assert not limiter.allow("a")
    assert limiter.allow("b")
    now[0] = 3600.0
    assert limiter.allow("a")


def test_user_prompt_defaults_to_varied_cuisines_and_language_name():
    prompt = build_user_prompt(RecipeRequest(image_base64=PHOTO))
    assert "surprise me" in prompt
    assert "Spanish (Spain)" in prompt
    prompt = build_user_prompt(RecipeRequest(image_base64=PHOTO, cuisine="Japonesa", language="en", count=2))
    assert "Cuisine: Japonesa" in prompt and "English" in prompt and "Number of recipes: 2" in prompt
