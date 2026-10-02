import { describe, expect, test } from 'bun:test';
import { canonicalRedirect } from './redirects';

const h = (o: Record<string, string>) => new Headers(o);
const apex = h({ host: 'opensourcelegends.com' });

describe('canonicalRedirect', () => {
  test('www goes to the apex on https, never with the server port', () => {
    expect(canonicalRedirect(h({ host: 'www.opensourcelegends.com:3000' }), '/cards', '?a=1')).toEqual({
      location: 'https://opensourcelegends.com/cards?a=1',
      status: 308,
    });
    expect(
      canonicalRedirect(h({ host: '0.0.0.0:3000', 'x-forwarded-host': 'www.opensourcelegends.com' }), '/', '')?.location,
    ).toBe('https://opensourcelegends.com/');
  });
  test('apex canonical paths pass through', () => {
    expect(canonicalRedirect(apex, '/', '')).toBeNull();
    expect(canonicalRedirect(apex, '/cards', '')).toBeNull();
  });
  test('/v1 and /v1/ do not loop', () => {
    expect(canonicalRedirect(apex, '/v1', '')).toEqual({ location: 'https://opensourcelegends.com/v1/', status: 307 });
    expect(canonicalRedirect(apex, '/v1/', '')).toBeNull();
    expect(canonicalRedirect(apex, '/v1/legends/', '')).toBeNull();
  });
  test('other trailing slashes are stripped', () => {
    expect(canonicalRedirect(apex, '/cards/', '?x=1')?.location).toBe('https://opensourcelegends.com/cards?x=1');
  });
});
