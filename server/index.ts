import express from 'express';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import Anthropic from '@anthropic-ai/sdk';
import { betaZodOutputFormat } from '@anthropic-ai/sdk/helpers/beta/zod';
import { z } from 'zod';
import { SYSTEM_INSTRUCTION } from './prompt.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const distDir = path.resolve(__dirname, '../dist');
const app = express();
app.use(express.json({ limit: '200kb' }));

// Mudel: ANTHROPIC_MODEL keskkonnamuutujast, vaikimisi Claude Opus 5.5.
const MODEL = process.env.ANTHROPIC_MODEL || 'claude-opus-5-5';

// Vastuse kuju, mida kasutajaliides ootab.
const SummarySchema = z.object({
  lyhikokkuvote: z.string(),
  tahelepanekud: z.array(z.string()),
  kusimused: z.array(z.string()),
  piirangud: z.array(z.string()),
});

// Kokkuvõtte teksti koostamine. Sisend on ainult rakenduses arvutatud koondnäitajad.
app.post('/api/summary', async (req, res) => {
  if (!process.env.ANTHROPIC_API_KEY) {
    return res.status(503).json({ error: 'Claude API võti on serveris seadistamata (ANTHROPIC_API_KEY).' });
  }
  const payload = req.body;
  if (!payload || typeof payload !== 'object' || !payload.kokku) {
    return res.status(400).json({ error: 'Päringust puuduvad arvutatud näitajad.' });
  }

  const client = new Anthropic(); // loeb ANTHROPIC_API_KEY keskkonnast
  try {
    const response = await client.beta.messages.parse({
      model: MODEL,
      max_tokens: 16000,
      // Kui mudel keeldub, jätkab serveripoolne varumudel sama päringuga.
      betas: ['server-side-fallback-2026-07-01'],
      fallbacks: 'default',
      system: SYSTEM_INSTRUCTION,
      messages: [
        {
          role: 'user',
          content: `Koosta müügikoosoleku kokkuvõte nende arvutatud näitajate põhjal:\n${JSON.stringify(payload, null, 2)}`,
        },
      ],
      output_config: { effort: 'medium', format: betaZodOutputFormat(SummarySchema) },
    });

    if (response.stop_reason === 'refusal') {
      return res.status(502).json({ error: 'Mudel keeldus kokkuvõtet koostamast.' });
    }
    const out = response.parsed_output;
    if (!out) {
      return res.status(502).json({ error: 'Mudeli vastust ei õnnestunud lugeda.' });
    }
    return res.json({
      lyhikokkuvote: out.lyhikokkuvote,
      tahelepanekud: out.tahelepanekud.slice(0, 3),
      kusimused: out.kusimused.slice(0, 2),
      piirangud: out.piirangud,
    });
  } catch (err) {
    // Täpsemad veatüübid enne üldisi.
    let message = 'Claude API päring ebaõnnestus.';
    if (err instanceof Anthropic.AuthenticationError) message = 'Claude API võti on vigane.';
    else if (err instanceof Anthropic.NotFoundError) message = `Mudelit „${MODEL}” ei leitud.`;
    else if (err instanceof Anthropic.RateLimitError) message = 'Claude API päringute limiit on täis. Proovi hiljem uuesti.';
    else if (err instanceof Anthropic.APIConnectionError) message = 'Claude API-ga ei saadud ühendust.';
    console.error('Claude päring ebaõnnestus:', err instanceof Error ? err.message : err);
    return res.status(502).json({ error: message });
  }
});

// Ehitatud kasutajaliides.
app.use(express.static(distDir));
app.get('*', (_req, res) => res.sendFile(path.join(distDir, 'index.html')));

const port = Number(process.env.PORT) || 3000;
app.listen(port, () => console.log(`Rakendus töötab pordil ${port}`));
