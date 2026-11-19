# Müügikoosoleku kokkuvõtte tegija

Eestikeelne veebirakendus, mis arvutab müügiandmetest (fiktiivsed näidisandmed või kasutaja CSV) põhinäitajad ja koostab Anthropic Claude'i mudeliga koosolekuks lühikese kokkuvõtte. Claude saab ainult rakenduses arvutatud koondnäitajad.

- Frontend: Vite + React + TypeScript (`src/`)
- Server: Express (`server/`) – serveerib `dist/` ja `POST /api/summary`
- Arvutused: `src/lib/metrics.ts`, CSV töötlus: `src/lib/csv.ts`

## Railway seadistus

- Build: `npm run build`, start: `npm start`
- Keskkonnamuutujad: `ANTHROPIC_API_KEY` (kohustuslik), `ANTHROPIC_MODEL` (valikuline, vaikimisi `claude-opus-5-5`)
- Node versioon: 22 (`.node-version`)
