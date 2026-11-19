import express from 'express';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { GoogleGenAI, Type } from '@google/genai';
import { SYSTEM_INSTRUCTION } from './prompt.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const distDir = path.resolve(__dirname, '../dist');
const app = express();
app.use(express.json({ limit: '200kb' }));

// Mudel: GEMINI_MODEL keskkonnamuutujast; kui see pole saadaval, proovitakse järgmisi.
const MODELS = [process.env.GEMINI_MODEL, 'gemini-flash-latest', 'gemini-2.5-flash'].filter(Boolean) as string[];

const responseSchema = {
  type: Type.OBJECT,
  properties: {
    lyhikokkuvote: { type: Type.STRING },
    tahelepanekud: { type: Type.ARRAY, items: { type: Type.STRING } },
    kusimused: { type: Type.ARRAY, items: { type: Type.STRING } },
    piirangud: { type: Type.ARRAY, items: { type: Type.STRING } },
  },
  required: ['lyhikokkuvote', 'tahelepanekud', 'kusimused', 'piirangud'],
  propertyOrdering: ['lyhikokkuvote', 'tahelepanekud', 'kusimused', 'piirangud'],
};

// Kokkuvõtte teksti koostamine. Sisend on ainult rakenduses arvutatud koondnäitajad.
app.post('/api/summary', async (req, res) => {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    return res.status(503).json({ error: 'Gemini API võti on serveris seadistamata (GEMINI_API_KEY).' });
  }
  const payload = req.body;
  if (!payload || typeof payload !== 'object' || !payload.kokku) {
    return res.status(400).json({ error: 'Päringust puuduvad arvutatud näitajad.' });
  }

  const ai = new GoogleGenAI({ apiKey });
  let lastError: unknown;
  for (const model of MODELS) {
    try {
      const result = await ai.models.generateContent({
        model,
        contents: `Koosta müügikoosoleku kokkuvõte nende arvutatud näitajate põhjal:\n${JSON.stringify(payload, null, 2)}`,
        config: {
          systemInstruction: SYSTEM_INSTRUCTION,
          responseMimeType: 'application/json',
          responseSchema,
          temperature: 0.2,
        },
      });
      const parsed = JSON.parse(result.text ?? '');
      return res.json({
        lyhikokkuvote: String(parsed.lyhikokkuvote ?? ''),
        tahelepanekud: (parsed.tahelepanekud ?? []).slice(0, 3).map(String),
        kusimused: (parsed.kusimused ?? []).slice(0, 2).map(String),
        piirangud: (parsed.piirangud ?? []).map(String),
      });
    } catch (err) {
      lastError = err;
      console.error(`Gemini päring ebaõnnestus (mudel ${model}):`, err instanceof Error ? err.message : err);
    }
  }
  return res.status(502).json({
    error: 'Gemini päring ebaõnnestus.',
    detail: lastError instanceof Error ? lastError.message.slice(0, 300) : undefined,
  });
});

// Ehitatud kasutajaliides.
app.use(express.static(distDir));
app.get('*', (_req, res) => res.sendFile(path.join(distDir, 'index.html')));

const port = Number(process.env.PORT) || 3000;
app.listen(port, () => console.log(`Rakendus töötab pordil ${port}`));
