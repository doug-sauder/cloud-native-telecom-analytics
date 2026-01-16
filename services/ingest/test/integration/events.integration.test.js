import request from 'supertest';

const baseUrl = process.env.API_BASE_URL || 'http://localhost:3000';

describe('Integration: POST /v1/events', () => {
  it('inserts one event and rejects duplicate event_id', async () => {
    const payload = {
      event_id: '22222222-2222-2222-2222-222222222222',
      source: 'jest-it',
      event_time: '2026-01-01T00:00:00Z',
      entity_type: 'cell',
      entity_id: 'cell-it-001',
      metrics: { dl_prb_util_pct: 12.3, ul_prb_util_pct: 4.5 },
    };

    const r1 = await request(baseUrl)
      .post('/v1/events')
      .send(payload)
      .set('Accept', 'application/json');

    expect(r1.statusCode).toBe(201);
    expect(r1.body).toEqual({ event_id: payload.event_id });

    const r2 = await request(baseUrl)
      .post('/v1/events')
      .send(payload)
      .set('Accept', 'application/json');

    expect(r2.statusCode).toBe(409);
    expect(r2.body).toMatchObject({ error: 'duplicate_event', event_id: payload.event_id });
  });
});
