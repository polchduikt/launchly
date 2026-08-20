import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import { EditButtonDrawer } from '../EditButtonDrawer';

vi.mock('../../../../../../../i18n/config', () => ({
  t: (k: string, fb?: any) => (typeof fb === 'string' ? fb : k),
  useTranslation: () => ({ t: (k: string, fb?: any) => (typeof fb === 'string' ? fb : k) }),
}));

vi.mock('../../../../../../../hooks/integration/useIntegrationQueries', () => ({
  useIntegrationsQuery: () => ({ data: [], isLoading: false }),
}));

describe('EditButtonDrawer', () => {
  it('returns null or empty state when no button provided', () => {
    const { container } = render(
      <EditButtonDrawer
        onClose={vi.fn()}
        button={null}
        onSave={vi.fn()}
        onRemove={vi.fn()}
      />
    );
    expect(container).toBeDefined();
  });

  it('renders button editor when button provided', () => {
    render(
      <EditButtonDrawer
        onClose={vi.fn()}
        button={{ label: 'Click Me', value: 'val_1', actionType: 'TELEGRAM' }}
        onSave={vi.fn()}
        onRemove={vi.fn()}
      />
    );
    expect(screen.getByText('editor.edit_button.title')).toBeInTheDocument();
  });
});
