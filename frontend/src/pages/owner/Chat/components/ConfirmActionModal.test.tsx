import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { ConfirmActionModal } from './ConfirmActionModal';

describe('ConfirmActionModal Component', () => {
  it('does not render when isOpen is false', () => {
    render(
      <ConfirmActionModal
        isOpen={false}
        title="Block Contact"
        message="Block user from sending messages?"
        onConfirm={vi.fn()}
        onClose={vi.fn()}
      />
    );
    expect(screen.queryByText('Block Contact')).not.toBeInTheDocument();
  });

  it('renders modal and executes confirm callback on click', async () => {
    const handleConfirm = vi.fn();
    const handleClose = vi.fn();
    const user = userEvent.setup();

    render(
      <ConfirmActionModal
        isOpen={true}
        title="Block Contact"
        message="Block user from sending messages?"
        confirmText="Yes, Block"
        cancelText="No, Keep"
        isDanger={true}
        onConfirm={handleConfirm}
        onClose={handleClose}
      />
    );

    expect(screen.getByText('Block Contact')).toBeInTheDocument();
    expect(screen.getByText('Block user from sending messages?')).toBeInTheDocument();

    const confirmBtn = screen.getByText('Yes, Block');
    await user.click(confirmBtn);

    expect(handleConfirm).toHaveBeenCalledTimes(1);
  });
});
