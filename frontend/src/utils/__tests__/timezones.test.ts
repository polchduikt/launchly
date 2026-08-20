import { describe, it, expect } from 'vitest';
import { getAllTimezones } from '../timezones';

describe('timezones utility', () => {
  it('returns sorted list of timezone options with IANA values and labels', () => {
    const list = getAllTimezones();

    expect(list.length).toBeGreaterThan(20);
    expect(list[0]).toHaveProperty('value');
    expect(list[0]).toHaveProperty('label');
    expect(list[0]).toHaveProperty('offset');

    const kyiv = list.find((tz) => tz.value === 'Europe/Kyiv');
    expect(kyiv).toBeDefined();
    expect(kyiv?.label).toContain('Kyiv');
  });

  it('returns cached list on subsequent calls', () => {
    const first = getAllTimezones();
    const second = getAllTimezones();

    expect(first).toBe(second);
  });
});
