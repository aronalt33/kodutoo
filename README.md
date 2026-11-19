# Müügikoosoleku kokkuvõtte tegija

Eestikeelne veebirakendus, mis arvutab müügiandmetest (fiktiivsed näidisandmed või kasutaja CSV) põhinäitajad ja koostab Gemini mudeliga koosolekuks lühikese kokkuvõtte. Gemini saab ainult rakenduses arvutatud koondnäitajad.

- Frontend: Vite + React + TypeScript (`src/`)
- Server: Express (`server/`) – serveerib `dist/` ja `POST /api/summary`
- Arvutused: `src/lib/metrics.ts`, CSV töötlus: `src/lib/csv.ts`

## Railway seadistus

- Build: `npm run build`, start: `npm start`
- Keskkonnamuutujad: `GEMINI_API_KEY` (kohustuslik), `GEMINI_MODEL` (valikuline, vaikimisi `gemini-flash-latest`)
