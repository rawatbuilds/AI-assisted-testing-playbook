/**
 * SauceDemo publishes these demo credentials on its own login page.
 * They are public test accounts, not real credentials.
 */
export const PASSWORD = process.env.SAUCE_PASSWORD ?? 'secret_sauce';

export const users = {
  standard: { username: 'standard_user', password: PASSWORD },
  lockedOut: { username: 'locked_out_user', password: PASSWORD },
} as const;
