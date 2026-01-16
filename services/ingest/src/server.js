// Load environment variables from .env file
import 'dotenv/config.js';
import express from 'express';
import eventsRouter from './routes/events.js';
import { ping, initialize } from './db.js';

// Initialize Express app and middleware
const app = express();
app.use(express.json({ limit: '1mb' }));

// Health check endpoint (kubernetes-style `/healthz`)
app.get('/healthz', (req, res) => res.sendStatus(200));

app.get('/readyz', async (req, res) => {
  try {
    await ping();
    res.sendStatus(200);
  } catch {
    res.sendStatus(503);
  }
});

// Mount event ingestion routes
app.use('/v1/events', eventsRouter);

const port = process.env.PORT || 3000;

// Initialize database connection and start HTTP server
async function start() {
  await initialize();
  app.listen(port, () => console.log(`Ingest service listening on ${port}`));
}

// Only start server if this module is run directly (not imported for testing)
if (import.meta.url === `file://${process.argv[1]}`) {
  start().catch((err) => {
    console.error(err);
    process.exit(1);
  });
}

export default app;
