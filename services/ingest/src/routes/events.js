// events.js
import express from 'express';
import * as db from '../db.js';

const router = express.Router();

router.post('/', async (req, res) => {
  try {
    const { event_id, schema_version, source, event_time, entity_type, entity_id, metrics } = req.body;

    // Validate required fields
    if (!event_time || !entity_id || metrics == null) {
      return res.status(400).json({ error: 'event_time, entity_id, and metrics are required' });
    }

    if (typeof metrics !== 'object' || Array.isArray(metrics)) {
      return res.status(400).json({ error: 'metrics must be an object' });
    }

    // Parse and validate timestamp
    const ts = new Date(event_time);
    if (Number.isNaN(ts.getTime())) {
      return res.status(400).json({ error: 'event_time must be a valid timestamp string' });
    }

    const { event_id: id, inserted } = await db.insertEvent({
      event_id,
      schema_version,
      source,
      event_time: ts.toISOString(),
      entity_type,
      entity_id,
      metrics,
    });

    if (!inserted) {
      return res.status(409).json({ error: 'duplicate_event', event_id: id });
    }

    return res.status(201).json({ event_id: id });
  } catch (err) {
    console.error('Failed to insert event', err);
    return res.status(500).json({ error: 'internal_server_error' });
  }
});

export default router;
