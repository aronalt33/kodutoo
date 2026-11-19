import express from 'express';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

// Server ainult serveerib ehitatud kasutajaliidest. Kõik arvutused ja raport tehakse brauseris;
// väliseid AI-teenuseid ei kasutata.
const __dirname = path.dirname(fileURLToPath(import.meta.url));
const distDir = path.resolve(__dirname, '../dist');
const app = express();

app.use(express.static(distDir));
app.get('*', (_req, res) => res.sendFile(path.join(distDir, 'index.html')));

const port = Number(process.env.PORT) || 3000;
app.listen(port, () => console.log(`Rakendus töötab pordil ${port}`));
