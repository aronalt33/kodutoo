# Müügitulemused ja analüütika

Eestikeelne veebirakendus, mis arvutab müügiandmetest (fiktiivsed näidisandmed või kasutaja CSV) valitud perioodi müügitulemused, võrdleb neid eelmise võrreldava perioodiga ja koostab reeglipõhise juhtimisraporti. Väliseid AI-teenuseid ega API võtmeid ei kasutata.

- Frontend: Vite + React + TypeScript (`src/`)
- Server: Express (`server/`) – serveerib ainult ehitatud kasutajaliidest
- Arvutused: `src/lib/metrics.ts` (KPI-d, perioodide võrdlus, müügilehter, kanalid, tooted)
- Raport: `src/lib/report.ts` (mallid ja lävendid, vt `THRESHOLDS` failis `src/lib/constants.ts`)
- CSV töötlus: `src/lib/csv.ts`

Eelmine periood = sama arv kuid vahetult enne valitud perioodi. Andmetes ei ole aasta veergu, seega jaanuari jms puhul võrdlusperioodi ei ole ja raport ütleb seda selgelt.

## Railway seadistus

- Build: `npm run build`, start: `npm start`
- Node versioon: 22 (`.node-version`)
- Keskkonnamuutujaid ei ole vaja (`GEMINI_API_KEY` / `ANTHROPIC_API_KEY` võib eemaldada).
