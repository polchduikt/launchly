import { describe, it, expect } from 'vitest';
import { templateWizardSchema } from './template.schema';

describe('templateWizardSchema', () => {
  it('validates a valid template wizard input', () => {
    const result = templateWizardSchema.safeParse({
      name: 'Welcome Template',
      description: 'A great starter template',
      guideUrl: 'https://example.com/guide',
      videoUrl: 'https://youtube.com/watch?v=123',
      isProtected: true,
    });
    expect(result.success).toBe(true);
  });

  it('fails when name is too short', () => {
    const result = templateWizardSchema.safeParse({
      name: 'A',
    });
    expect(result.success).toBe(false);
  });

  it('fails when url is invalid', () => {
    const result = templateWizardSchema.safeParse({
      name: 'Valid Name',
      guideUrl: 'invalid-url',
    });
    expect(result.success).toBe(false);
  });

  it('allows empty optional urls', () => {
    const result = templateWizardSchema.safeParse({
      name: 'Valid Name',
      guideUrl: '',
      videoUrl: '',
    });
    expect(result.success).toBe(true);
  });
});
