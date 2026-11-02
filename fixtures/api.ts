import { test as base, expect } from '@playwright/test';
import { buildBooking, type Booking } from '../data/booking';

type CreatedBooking = { id: number; booking: Booking };

type ApiFixtures = {
  /** Auth token for the public restful-booker demo account. */
  token: string;
  /** Creates a booking and deletes it after the test, so tests stay independent. */
  createBooking: (overrides?: Partial<Booking>) => Promise<CreatedBooking>;
};

export const test = base.extend<ApiFixtures>({
  token: async ({ request }, use) => {
    const res = await request.post('/auth', {
      // Public demo credentials documented by restful-booker.
      data: { username: 'admin', password: 'password123' },
    });
    expect(res.status(), 'auth endpoint reachable').toBe(200);
    const body = (await res.json()) as { token?: string };
    expect(body.token, 'auth should return a token').toBeTruthy();
    await use(body.token as string);
  },

  createBooking: async ({ request, token }, use) => {
    const createdIds: number[] = [];

    await use(async (overrides = {}) => {
      const payload = buildBooking(overrides);
      const res = await request.post('/booking', { data: payload });
      expect(res.status(), 'create booking').toBe(200);
      const body = (await res.json()) as { bookingid: number; booking: Booking };
      createdIds.push(body.bookingid);
      return { id: body.bookingid, booking: body.booking };
    });

    // Cleanup. Ignore the status: the test may already have deleted the booking.
    for (const id of createdIds) {
      await request.delete(`/booking/${id}`, { headers: { Cookie: `token=${token}` } });
    }
  },
});

export { expect };
