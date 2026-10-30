"""Request and response models.

`RecipeSuggestions` is also the JSON schema Gemini must fill, so the field
descriptions double as instructions for the model.
"""

from typing import Literal

from pydantic import BaseModel, Field

ImageMimeType = Literal["image/jpeg", "image/png", "image/webp", "image/heic", "image/heif"]


class RecipeRequest(BaseModel):
    # 12 MB of base64 is ~9 MB of image; the server's own limit is usually lower.
    image_base64: str = Field(min_length=1, max_length=12_000_000, description="The photo, base64 encoded.")
    mime_type: ImageMimeType = "image/jpeg"
    cuisine: str | None = Field(default=None, max_length=40)
    notes: str | None = Field(default=None, max_length=200)
    language: str = Field(default="es", pattern=r"^[a-z]{2}$")
    count: int = Field(default=3, ge=1, le=5)


class Ingredient(BaseModel):
    name: str = Field(description="Ingredient name, e.g. 'tomate'.")
    quantity: str = Field(description="Amount for this recipe, e.g. '2 unidades' or '200 g'.")
    in_photo: bool = Field(
        description="True only if the ingredient is visible in the photo. False for staples and anything to buy."
    )


class Recipe(BaseModel):
    title: str
    cuisine: str = Field(description="Cuisine of the dish, e.g. 'Mexicana'.")
    summary: str = Field(description="One or two appetising sentences about the dish.")
    minutes: int = Field(description="Total time in minutes, preparation included.")
    difficulty: Literal["easy", "medium", "hard"]
    servings: int
    ingredients: list[Ingredient]
    steps: list[str] = Field(description="One action per step, with times and heat levels.")
    tip: str = Field(description="A short chef's tip, or an empty string.")


class RecipeSuggestions(BaseModel):
    detected_ingredients: list[str] = Field(description="Food items actually visible in the photo.")
    notice: str = Field(
        description="Empty string normally. If the photo shows no usable food, a short explanation for the user."
    )
    recipes: list[Recipe]


class RecipeResponse(RecipeSuggestions):
    model: str
