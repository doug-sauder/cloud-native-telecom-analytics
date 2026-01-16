import { jest } from '@jest/globals';
import request from 'supertest';

// Mock db before importing app
jest.unstable_mockModule('../../src/db.js', () => ({
  pool: {},
  initialize: jest.fn(async () => {}),
  ping: jest.fn(async () => {}),
  insertEvent: jest.fn(async () => ({ event_id: '11111111-1111-1111-1111-111111111111', inserted: true })),

}));

const app = (await import('../../src/server.js')).default;

describe('POST /v1/events', () => {
  it('returns 201 and event_id on success', async () => {
    const payload = {
      event_time: new Date().toISOString(),
      entity_id: 'cell-1',
      metrics: { dl_prb_util_pct: 12.3 }
    };
    const res = await request(app).post('/v1/events').send(payload).set('Accept', 'application/json');
    expect(res.statusCode).toBe(201);
    expect(res.body).toHaveProperty('event_id');
  });

  it('returns 400 when missing required fields', async () => {
    const res = await request(app).post('/v1/events').send({}).set('Accept', 'application/json');
    expect(res.statusCode).toBe(400);
  });
});
