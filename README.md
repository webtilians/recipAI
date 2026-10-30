# RecipAI

App de recetas: haces una foto a la nevera, la despensa o la mesa, eliges el tipo de cocina
(mediterránea, japonesa, vietnamita, india, mexicana…) y una IA te propone varias recetas con
lo que tienes, con los ingredientes y los pasos para cocinarlas.

Primero para iPhone; el mismo código servirá para Android.

## Cómo está hecho

```
iPhone (app Expo)  ──foto + cocina + notas──▶  backend (FastAPI)  ──▶  Gemini
                   ◀──── recetas en JSON ─────                     ◀──
```

| Carpeta | Qué es |
| --- | --- |
| [`mobile/`](mobile) | La app: Expo SDK 58, React Native, TypeScript y Expo Router. |
| [`backend/`](backend) | API en Python (FastAPI) que llama a Gemini. Guarda la clave de Gemini en el servidor, nunca en la app. |

- La app reduce la foto a 1280 px y la envía como JPEG (unos 150–300 KB).
- El backend pide a Gemini una respuesta con un esquema JSON fijo:
  - ingredientes detectados;
  - recetas con tiempo, dificultad y raciones;
  - de cada ingrediente, si se ve en la foto o hay que tenerlo o comprarlo;
  - pasos y un truco.
- El texto que aparezca en la foto (etiquetas, notas) se trata solo como información, nunca como instrucciones.
- La pantalla de una receta no se apaga mientras cocinas. Al tocar un paso se marca como hecho.

## Requisitos (Windows)

- **Node 22.13 o más reciente.** Expo SDK 58 ya no funciona con Node 20. Con nvm: `nvm install 22` y `nvm use 22`.
- **Python 3.12** para el backend.
- **Expo Go** instalada en el iPhone (App Store). No hace falta Mac para probar.

## Probarlo en tu iPhone

### 1. Backend

```powershell
cd backend
py -3.12 -m venv .venv
.venv\Scripts\python -m pip install -r requirements-dev.txt
copy .env.example .env
```

En `backend\.env`, pon tu `GEMINI_API_KEY`. Se saca en https://aistudio.google.com/apikey.
Si todavía no la tienes, pon `RECIPAI_DEMO=1`: devuelve recetas de ejemplo sin coste.

```powershell
.venv\Scripts\python -m uvicorn app.main:app --host 0.0.0.0 --port 8300
```

`http://localhost:8300/health` debe responder `"ai_configured": true`. Si Windows pregunta por
el firewall, permite Python en redes privadas, para que el iPhone llegue al PC.

### 2. App

```powershell
cd mobile
npm install
copy .env.example .env
```

En `mobile\.env`, pon la IP del PC en la wifi (`ipconfig` → Dirección IPv4), por ejemplo
`EXPO_PUBLIC_API_URL=http://192.168.1.50:8300`.

```powershell
npx expo start
```

Escanea el QR con la cámara del iPhone: se abre en Expo Go. El iPhone y el PC deben estar
en la misma wifi.

## Comprobaciones

```powershell
cd backend; .venv\Scripts\python -m pytest -q
cd mobile; npm run typecheck; npm run lint
```

GitHub Actions ejecuta lo mismo en cada PR y además empaqueta la app de iOS.

## Configuración del backend

| Variable | Para qué |
| --- | --- |
| `GEMINI_API_KEY` | Clave de Gemini. No se sube nunca al repo. |
| `GEMINI_MODEL` | Modelo; por defecto `gemini-flash-latest`. |
| `RECIPAI_DEMO` | `1` = recetas de ejemplo, sin Gemini. |
| `RECIPAI_APP_TOKEN` | Si se define, la app debe enviar el mismo valor (`EXPO_PUBLIC_RECIPAI_TOKEN`). Frena el uso casual de tu API, aunque quien abra la app podría extraerlo. |
| `RECIPAI_RATE_LIMIT_PER_HOUR` | Peticiones por IP y hora; por defecto 30. |
| `RECIPAI_MAX_IMAGE_MB` | Tamaño máximo de foto; por defecto 6. |
| `RECIPAI_CORS_ORIGINS` | Solo para la vista web (`npx expo start --web`), p. ej. `http://localhost:8081`. |

Detrás de un proxy (Caddy), arranca uvicorn con `--proxy-headers`. Así el límite por IP ve la IP
real del móvil.

## Camino a la App Store

1. Desplegar el backend con HTTPS. Por ejemplo, en el VPS, junto a DH Trails: subdominio propio y puerto 8300.
2. Darse de alta en el Apple Developer Program (99 $/año).
3. Compilar en la nube, sin Mac:
   - `npx eas-cli@latest build -p ios --profile production`
   - luego `npx eas-cli@latest submit -p ios` para subirla a TestFlight.
4. Definir `EXPO_PUBLIC_API_URL` para EAS (`eas env:create` o `env` en `eas.json`), porque `.env` no se sube.
5. Antes de publicar:
   - icono y pantalla de inicio propios (ahora son los de Expo);
   - política de privacidad;
   - la declaración de privacidad de Apple: la foto se envía a Google Gemini.

   Con la API gratuita de Gemini, Google puede usar los datos para mejorar sus productos.
   Con facturación activada, no.

Android usa el mismo código: `npx expo start` con Expo Go para Android y, para publicar,
`eas build -p android`.

## Ideas para después

- Guardar recetas favoritas e historial.
- Ajustar raciones y generar la lista de la compra con lo que falta.
- Restricciones fijas en el perfil (vegetariano, alergias).
- Más idiomas: el backend ya acepta `language`.
