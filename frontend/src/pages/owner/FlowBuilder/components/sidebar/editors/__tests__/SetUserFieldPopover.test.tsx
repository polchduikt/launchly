import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import { SetUserFieldPopover } from '../SetUserFieldPopover';

vi.mock('../../../../../../../i18n/config', () => ({
  t: (k: string, fb?: any) => (typeof fb === 'string' ? fb : k),
  useTranslation: () => ({ t: (k: string, fb?: any) => (typeof fb === 'string' ? fb : k) }),
}));

describe('SetUserFieldPopover', () => {
  it('renders popover with user fields', () => {
    render(
      <SetUserFieldPopover
        fieldName="email"
        fieldValue="test@example.com"
        userFields={[{ name: 'email', type: 'Text', description: '' }]}
        tags={[]}
        onClose={vi.fn()}
        onSave={vi.fn()}
        onCreateNewField={vi.fn()}
      />
    );

    expect(screen.getByText('User Field')).toBeInTheDocument();
  });
});
