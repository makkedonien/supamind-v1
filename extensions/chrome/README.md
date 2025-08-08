# Supamind Chrome Extension (Add to Feed)

## Dev

- Fill SUPABASE_URL and SUPABASE_ANON_KEY in `src/supabase.ts` for local dev or pass via Vite env.
- Run: `npm install && npm run dev`.
- Load unpacked extension from `extensions/chrome/dist` in Chrome.

## Build

- `npm run build` → outputs to `dist/`.

## Notes

- Auth flow uses the web app route `/extension-auth` to pass session back via postMessage.
- Ensure the web app is deployed on your domain and replace `https://your-app-domain` in `src/popup.ts`.

