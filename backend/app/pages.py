"""Public pages App Store Connect links to: privacy policy and support (Spanish, like the app)."""

from html import escape

REPO_ISSUES = "https://github.com/webtilians/recipAI/issues"
GEMINI_TERMS = "https://ai.google.dev/gemini-api/terms"
UPDATED = "1 de noviembre de 2026"

STYLE = """
:root { color-scheme: light dark; --accent: #D9481F; --bg: #FFF9F4; --text: #1F1A17; --muted: #6F6259; }
@media (prefers-color-scheme: dark) { :root { --accent: #FF7A50; --bg: #15110F; --text: #F7F1EC; --muted: #B8ABA1; } }
body { margin: 0; background: var(--bg); color: var(--text); font: 17px/1.55 -apple-system, system-ui, sans-serif; }
main { max-width: 680px; margin: 0 auto; padding: 32px 16px 64px; }
h1 { font-size: 32px; line-height: 1.2; margin: 0 0 4px; }
h1 span, a { color: var(--accent); }
h2 { font-size: 20px; margin: 32px 0 8px; }
.muted { color: var(--muted); font-size: 15px; }
nav { margin-top: 40px; display: flex; gap: 20px; font-size: 15px; }
"""


def _page(title: str, body: str) -> str:
    return f"""<!doctype html>
<html lang="es">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>{escape(title)} · RecipAI</title>
<style>{STYLE}</style>
</head>
<body><main>
<h1>Recip<span>AI</span></h1>
{body}
<nav><a href="/soporte">Soporte</a><a href="/privacidad">Privacidad</a></nav>
</main></body>
</html>"""


def _contact(email: str) -> str:
    if email:
        safe = escape(email)
        return f'escribe a <a href="mailto:{safe}">{safe}</a> o abre una incidencia en <a href="{REPO_ISSUES}">GitHub</a>'
    return f'abre una incidencia en <a href="{REPO_ISSUES}">GitHub</a>'


def privacy_page(contact_email: str) -> str:
    return _page(
        "Política de privacidad",
        f"""
<p class="muted">Política de privacidad · actualizada el {UPDATED}</p>

<p>RecipAI te propone recetas a partir de una foto de tu nevera, tu despensa o tu mesa.
No necesitas cuenta: no pedimos tu nombre, tu email ni ningún otro dato para usarla.</p>

<h2>Qué datos se tratan</h2>
<p>Solo lo que tú envías al pulsar «Buscar recetas»: la foto, el tipo de cocina elegido y las notas
opcionales que escribas. La foto se reduce de tamaño en tu móvil antes de enviarla.</p>

<h2>Para qué</h2>
<p>Para reconocer los ingredientes de la foto y escribir recetas con ellos. No usamos estos datos
para publicidad, perfiles ni seguimiento, y la app no contiene publicidad ni herramientas de analítica.</p>

<h2>Con quién se comparten</h2>
<p>Nuestro servidor envía la foto y el texto a <strong>Gemini, la IA de Google</strong> (Google LLC),
que devuelve las recetas. Google trata esa información según las
<a href="{GEMINI_TERMS}">condiciones de la API de Gemini</a>. Cuando el servicio se usa sin
facturación, esas condiciones permiten a Google usar el contenido para mejorar sus productos,
con revisión humana. Por eso te pedimos que no envíes fotos con personas ni con datos personales.
La app te avisa y te pide permiso antes de enviar la primera foto.</p>

<h2>Cuánto tiempo se guardan</h2>
<p>RecipAI no guarda tus fotos, tus notas ni las recetas: el servidor procesa la petición y la descarta.
Por seguridad y para limitar abusos, el servidor anota la dirección IP y la hora de cada petición
en sus registros técnicos durante un tiempo limitado. En tu móvil, la app solo recuerda que
aceptaste el aviso sobre Gemini. Las fotos que haces desde la app no se guardan en tu galería.</p>

<h2>Tus derechos y contacto</h2>
<p>Como no guardamos datos asociados a ti, no hay una cuenta ni un historial que borrar. Para
cualquier duda o para ejercer tus derechos, {_contact(contact_email)}.</p>
""",
    )


def support_page(contact_email: str) -> str:
    return _page(
        "Soporte",
        f"""
<p class="muted">Soporte</p>

<p>Haz una foto a tu nevera, tu despensa o la mesa, elige el tipo de cocina que te apetece
(mediterránea, japonesa, vietnamita, india, mexicana…) y RecipAI te propone varias recetas
con lo que tienes, con los ingredientes y los pasos para cocinarlas.</p>

<h2>Consejos para una buena foto</h2>
<p>Abre bien la nevera o la despensa, aparta lo que tape los ingredientes y busca buena luz.
Puedes añadir notas como «vegetariana», «sin gluten» o «en menos de 20 minutos».</p>

<h2>Preguntas frecuentes</h2>
<p><strong>¿Las recetas son seguras?</strong> Las escribe una IA y pueden tener errores. Revisa
siempre los ingredientes si tienes alergias y asegúrate de que la carne, el pescado y los huevos
queden bien cocinados.</p>
<p><strong>No me deja hacer fotos.</strong> Da permiso de cámara a RecipAI en Ajustes › RecipAI.</p>
<p><strong>¿Qué pasa con mis fotos?</strong> Se envían a Gemini (Google) para reconocer los ingredientes
y no se guardan en RecipAI. Lo explica la <a href="/privacidad">política de privacidad</a>.</p>

<h2>Contacto</h2>
<p>Si algo falla o tienes una sugerencia, {_contact(contact_email)}.</p>
""",
    )
