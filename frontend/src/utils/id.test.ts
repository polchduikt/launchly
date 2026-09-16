import { describe, it, expect } from 'vitest';
import { generateId } from './id';

describe('generateId', () => {
  it('generates a unique id string', () => {
    const id1 = generateId();
    const id2 = generateId();
    expect(id1).toBeTruthy();
    expect(id2).toBeTruthy();
    expect(id1).not.toBe(id2);
  });

  it('prefixes the id when prefix is provided', () => {
    const id = generateId('block');
    expect(id.startsWith('block_')).toBe(true);
  });
});
