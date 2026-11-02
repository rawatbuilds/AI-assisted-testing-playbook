import { test, expect } from '../../fixtures/api';
import { buildBooking, type Booking } from '../../data/booking';

/**
 * Traceability: TC-API-* IDs map to scenarios/booking-api-test-matrix.md
 *
 * Note: restful-booker is a deliberately quirky demo API. Where its behaviour is
 * questionable (e.g. HTTP 200 on failed auth) the test pins the observed behaviour
 * and the comment says so, rather than pretending it is good API design.
 */

/** Minimal response-shape check, so a changed contract fails loudly. */
function expectBookingShape(b: unknown): asserts b is Booking {
  expect(b).toMatchObject({
    firstname: expect.any(String),
    lastname: expect.any(String),
    totalprice: expect.any(Number),
    depositpaid: expect.any(Boolean),
    bookingdates: { checkin: expect.stringMatching(/^\d{4}-\d{2}-\d{2}$/), checkout: expect.stringMatching(/^\d{4}-\d{2}-\d{2}$/) },
  });
}

test.describe('Health and auth', () => {
  test('TC-API-01 health check responds', async ({ request }) => {
    const res = await request.get('/ping');
    expect(res.status()).toBe(201); // restful-booker returns 201 Created for /ping
  });

  test('TC-API-02 valid credentials return a token', async ({ token }) => {
    expect(typeof token).toBe('string');
    expect(token.length).toBeGreaterThan(5);
  });

  test('TC-API-03 bad credentials do not return a token', async ({ request }) => {
    const res = await request.post('/auth', { data: { username: 'admin', password: 'wrong' } });
    const body = (await res.json()) as { token?: string; reason?: string };

    expect(body.token).toBeUndefined();
    expect(body.reason).toBe('Bad credentials');
    // Quirk: this API reports failed auth with HTTP 200. A stricter API would use 401.
    expect(res.status()).toBe(200);
  });
});

test.describe('Booking lifecycle', () => {
  test('TC-API-04 create returns an id and echoes the booking', async ({ createBooking }) => {
    const input = buildBooking({ firstname: 'Rohan', lastname: 'Iyer', totalprice: 999 });
    const { id, booking } = await createBooking(input);

    expect(id).toBeGreaterThan(0);
    expectBookingShape(booking);
    expect(booking).toMatchObject({ firstname: 'Rohan', lastname: 'Iyer', totalprice: 999 });
  });

  test('TC-API-05 get by id returns what was created', async ({ request, createBooking }) => {
    const { id, booking } = await createBooking({ firstname: 'Meera' });

    const res = await request.get(`/booking/${id}`);
    expect(res.status()).toBe(200);
    const fetched = await res.json();
    expectBookingShape(fetched);
    expect(fetched).toMatchObject({ firstname: 'Meera', totalprice: booking.totalprice });
  });

  test('TC-API-06 update with a valid token changes the booking', async ({ request, token, createBooking }) => {
    const { id } = await createBooking();

    const res = await request.put(`/booking/${id}`, {
      headers: { Cookie: `token=${token}` },
      data: buildBooking({ firstname: 'Updated', totalprice: 2000 }),
    });
    expect(res.status()).toBe(200);

    const after = await (await request.get(`/booking/${id}`)).json();
    expect(after).toMatchObject({ firstname: 'Updated', totalprice: 2000 });
  });

  test('TC-API-07 delete without a token is forbidden', async ({ request, createBooking }) => {
    const { id } = await createBooking();

    const res = await request.delete(`/booking/${id}`);
    expect(res.status()).toBe(403);

    // The booking must still exist: the rejected call had no side effect.
    expect((await request.get(`/booking/${id}`)).status()).toBe(200);
  });

  test('TC-API-08 delete with a token removes the booking', async ({ request, token, createBooking }) => {
    const { id } = await createBooking();

    const del = await request.delete(`/booking/${id}`, { headers: { Cookie: `token=${token}` } });
    expect(del.status()).toBe(201); // quirk: restful-booker answers 201 Created on delete

    expect((await request.get(`/booking/${id}`)).status()).toBe(404);
  });

  test('TC-API-09 missing required fields are rejected', async ({ request }) => {
    const { firstname: _omit, ...withoutFirstname } = buildBooking();

    const res = await request.post('/booking', { data: withoutFirstname });
    // Exact code is a quirk (the demo API returns 500), so assert "not accepted".
    expect(res.ok()).toBeFalsy();
  });

  test('TC-API-10 filtering by name finds the created booking', async ({ request, createBooking }) => {
    const unique = `Qa${Date.now()}`;
    const { id } = await createBooking({ firstname: unique });

    const res = await request.get('/booking', { params: { firstname: unique } });
    expect(res.status()).toBe(200);
    const ids = ((await res.json()) as { bookingid: number }[]).map((b) => b.bookingid);
    expect(ids).toContain(id);
  });

  test('TC-API-11 unknown id returns 404', async ({ request }) => {
    const res = await request.get('/booking/999999999');
    expect(res.status()).toBe(404);
  });
});
