import express from 'express';
import path from 'path';
import { fileURLToPath } from 'url';
import checkHandler from './api/check.js';
import inviteHandler from './api/invite.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const app = express();
const PORT = parseInt(process.env.PORT || '3000', 10);

app.use(express.json({ limit: '200kb' }));

app.post('/api/check', checkHandler);
app.post('/api/invite', inviteHandler);

app.use(express.static(__dirname, { index: 'index.html' }));

app.listen(PORT, () => {
  console.log(`Codex Inviter running on http://0.0.0.0:${PORT}`);
});
