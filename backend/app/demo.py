"""Canned answers for RECIPAI_DEMO=1: try the app end to end without a Gemini key or cost."""

import asyncio

from .schemas import Ingredient, Recipe, RecipeRequest, RecipeSuggestions


class DemoRecipes:
    model = "demo"

    def __init__(self, delay_seconds: float = 1.5):
        self.delay_seconds = delay_seconds

    async def suggest(self, image: bytes, request: RecipeRequest) -> RecipeSuggestions:
        await asyncio.sleep(self.delay_seconds)
        cuisine = (request.cuisine or "").strip() or "Mediterránea"
        return RecipeSuggestions(
            detected_ingredients=["huevos", "tomates", "cebolla", "pimiento verde", "queso feta", "pan"],
            notice="",
            recipes=[
                Recipe(
                    title="Huevos al horno con tomate y feta",
                    cuisine=cuisine,
                    summary="Huevos cuajados sobre un sofrito de tomate y pimiento, con feta desmigado por encima.",
                    minutes=30,
                    difficulty="easy",
                    servings=2,
                    ingredients=[
                        Ingredient(name="huevos", quantity="4", in_photo=True),
                        Ingredient(name="tomates", quantity="3", in_photo=True),
                        Ingredient(name="cebolla", quantity="1/2", in_photo=True),
                        Ingredient(name="pimiento verde", quantity="1", in_photo=True),
                        Ingredient(name="queso feta", quantity="80 g", in_photo=True),
                        Ingredient(name="aceite de oliva", quantity="2 cucharadas", in_photo=False),
                        Ingredient(name="comino", quantity="1/2 cucharadita", in_photo=False),
                    ],
                    steps=[
                        "Precalienta el horno a 200 °C.",
                        "Pica la cebolla y el pimiento y sofríelos 8 minutos a fuego medio con el aceite.",
                        "Añade el tomate troceado y el comino; cocina 10 minutos hasta que espese.",
                        "Haz cuatro huecos en la salsa y casca un huevo en cada uno.",
                        "Hornea 8–10 minutos, hasta que la clara cuaje y la yema siga líquida.",
                        "Desmiga el feta por encima y sirve con pan tostado.",
                    ],
                    tip="Si la sartén no va al horno, tápala y termina los huevos a fuego bajo.",
                ),
                Recipe(
                    title="Tostas de pan con tomate y pimiento asado",
                    cuisine=cuisine,
                    summary="Pan crujiente con tomate rallado, pimiento asado y un toque de feta.",
                    minutes=20,
                    difficulty="easy",
                    servings=2,
                    ingredients=[
                        Ingredient(name="pan", quantity="4 rebanadas", in_photo=True),
                        Ingredient(name="tomates", quantity="2", in_photo=True),
                        Ingredient(name="pimiento verde", quantity="1", in_photo=True),
                        Ingredient(name="queso feta", quantity="50 g", in_photo=True),
                        Ingredient(name="aceite de oliva", quantity="al gusto", in_photo=False),
                        Ingredient(name="sal", quantity="una pizca", in_photo=False),
                    ],
                    steps=[
                        "Asa el pimiento en una sartén a fuego fuerte 10 minutos, girándolo.",
                        "Pélalo y córtalo en tiras.",
                        "Tuesta el pan y ralla el tomate encima.",
                        "Coloca el pimiento, el feta, sal y un chorrito de aceite.",
                    ],
                    tip="",
                ),
            ],
        )
