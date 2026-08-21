import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { CreateBroadcastDialog } from './CreateBroadcastDialog';
import type { CreateBroadcastDialogProps } from '../../../../types/broadcast';

vi.mock('../../../../i18n/config', () => ({
  t: (k: string) => k,
  useTranslation: () => ({ t: (k: string, fb?: string) => fb || k }),
}));

describe('CreateBroadcastDialog', () => {
  const mockForm = {
    register: vi.fn().mockReturnValue({}),
    formState: { errors: {} }
  };

  const defaultProps: CreateBroadcastDialogProps = {
    isOpen: true,
    onClose: vi.fn(),
    onSubmit: vi.fn(),
    form: mockForm as unknown as never,
    isCreating: false,
    createError: null,
    bots: [],
    tags: [],
  };

  it('returns null when not open', () => {
    const { container } = render(<CreateBroadcastDialog {...defaultProps} isOpen={false} />);
    expect(container.firstChild).toBeNull();
  });

  it('renders correctly when open', () => {
    render(<CreateBroadcastDialog {...defaultProps} bots={[{ id: 1, name: 'Bot 1', hasTelegramToken: true } as unknown as never]} />);
    expect(screen.getByText('broadcast.dialog.create_title')).toBeInTheDocument();
    expect(screen.getByText('broadcast.dialog.campaign_name')).toBeInTheDocument();
  });

  it('handles close', () => {
    render(<CreateBroadcastDialog {...defaultProps} />);
    fireEvent.click(screen.getByText('broadcast.dialog.cancel'));
    expect(defaultProps.onClose).toHaveBeenCalled();
  });
});
