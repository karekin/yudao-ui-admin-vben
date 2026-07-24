import { describe, expect, it } from 'vitest';

import { isAgentControlUnavailable } from './index';

describe('isAgentControlUnavailable', () => {
  it.each([
    { code: 404 },
    { data: { code: 404 } },
    { response: { data: { code: 404 } } },
    { response: { status: 404 } },
  ])('recognizes an unavailable optional endpoint', (error) => {
    expect(isAgentControlUnavailable(error)).toBe(true);
  });

  it.each([
    undefined,
    new Error('network failure'),
    { data: { code: 500 } },
    { response: { status: 503 } },
  ])('does not hide other failures', (error) => {
    expect(isAgentControlUnavailable(error)).toBe(false);
  });
});
