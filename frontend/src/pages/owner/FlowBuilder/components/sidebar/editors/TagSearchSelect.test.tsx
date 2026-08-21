import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { TagSearchSelect } from './TagSearchSelect';

vi.mock('../../../../../../i18n/config', () => ({
  t: (k: string, fb?: string) => (typeof fb === 'string' ? fb : k),
  useTranslation: () => ({ t: (k: string, fb?: string) => (typeof fb === 'string' ? fb : k) }),
}));

describe('TagSearchSelect', () => {
  it('renders input and opens dropdown on focus/click', () => {
    const handleChange = vi.fn();
    const handleCreateTag = vi.fn();

    render(
      <TagSearchSelect
        tagName="VIP"
        tags={[{ id: 1, name: 'VIP' }, { id: 2, name: 'New Lead' }]}
        onChange={handleChange}
        onCreateTag={handleCreateTag}
      />
    );

    const input = screen.getByPlaceholderText('crm.tags.placeholder_select_or_search');
    expect(input).toBeInTheDocument();

    fireEvent.click(input);
    expect(screen.getByText('VIP')).toBeInTheDocument();
    expect(screen.getByText('New Lead')).toBeInTheDocument();
  });
});
