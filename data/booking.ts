export interface Booking {
  firstname: string;
  lastname: string;
  totalprice: number;
  depositpaid: boolean;
  bookingdates: { checkin: string; checkout: string };
  additionalneeds?: string;
}

/** Synthetic booking. Override only the fields a test cares about. */
export function buildBooking(overrides: Partial<Booking> = {}): Booking {
  return {
    firstname: 'Asha',
    lastname: 'Verma',
    totalprice: 1250,
    depositpaid: true,
    bookingdates: { checkin: '2026-12-01', checkout: '2026-12-05' },
    additionalneeds: 'Breakfast',
    ...overrides,
  };
}
