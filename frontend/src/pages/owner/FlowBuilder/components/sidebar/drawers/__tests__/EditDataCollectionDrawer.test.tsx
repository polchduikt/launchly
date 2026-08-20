import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import { EditDataCollectionDrawer } from '../EditDataCollectionDrawer';

vi.mock('../../../../../../../i18n/config', () => ({
  t: (k: string, fb?: string) => (typeof fb === 'string' ? fb : k),
  useTranslation: () => ({ t: (k: string, fb?: string) => (typeof fb === 'string' ? fb : k) }),
}));

describe('EditDataCollectionDrawer', () => {
  it('returns null when block is null', () => {
    const { container } = render(
      <EditDataCollectionDrawer
        onClose={vi.fn()}
        block={null}
        onSave={vi.fn()}
        onRemove={vi.fn()}
      />
    );
    expect(container.firstChild).toBeNull();
  });

  it('renders data collection drawer when block is provided', () => {
    render(
      <EditDataCollectionDrawer
        onClose={vi.fn()}
        block={{
          id: 'blk_1',
          type: 'DATA_COLLECTION',
          variableName: 'user_email',
          replyType: 'Text',
          expirationMinutes: 30,
          retryCount: 3,
        } as unknown as never}
        onSave={vi.fn()}
        onRemove={vi.fn()}
      />
    );
    expect(screen.getByText('editor.data_collection.title')).toBeInTheDocument();
  });
});
