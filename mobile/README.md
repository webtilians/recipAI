# RecipAI — app (Expo / React Native)

La guía completa está en el [README principal](../README.md).

```powershell
npm install
copy .env.example .env      # y pon EXPO_PUBLIC_API_URL
npx expo start              # escanea el QR con el iPhone (Expo Go)
```

| Comando | Qué hace |
| --- | --- |
| `npm run typecheck` | Comprueba los tipos de TypeScript |
| `npm run lint` | ESLint con la configuración de Expo |
| `npx expo-doctor` | Revisa dependencias y configuración |

Pantallas (Expo Router, en `src/app/`):

- `index.tsx`: foto, tipo de cocina y notas.
- `results.tsx`: espera, ingredientes detectados y recetas.
- `recipe/[index].tsx`: ingredientes y pasos; la pantalla no se apaga mientras cocinas.
