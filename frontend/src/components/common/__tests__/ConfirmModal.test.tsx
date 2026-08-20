import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { ConfirmModal } from '../ConfirmModal';

describe('ConfirmModal Component', () => {
  it('does not render when isOpen is false', () => {
    render(
      <ConfirmModal
        isOpen={false}
        title="Delete Bot"
        message="Are you sure you want to delete this bot?"
        onConfirm={vi.fn()}
        onClose={vi.fn()}
      />
    );
    expect(screen.queryByText('Delete Bot')).not.toBeInTheDocument();
  });

  it('renders title and message when isOpen is true', () => {
    render(
      <ConfirmModal
        isOpen={true}
        title="Delete Bot"
        message="Are you sure you want to delete this bot?"
        confirmText="Confirm Delete"
        cancelText="Cancel"
        onConfirm={vi.fn()}
        onClose={vi.fn()}
      />
    );
    expect(screen.getByText('Delete Bot')).toBeInTheDocument();
    expect(screen.getByText('Are you sure you want to delete this bot?')).toBeInTheDocument();
    expect(screen.getByText('Confirm Delete')).toBeInTheDocument();
    expect(screen.getByText('Cancel')).toBeInTheDocument();
  });

  it('calls onConfirm and onClose when confirm button is clicked', async () => {
    const handleConfirm = vi.fn();
    const handleClose = vi.fn();
    const user = userEvent.setup();

    render(
      <ConfirmModal
        isOpen={true}
        title="Delete Campaign"
        message="Are you sure?"
        confirmText="Yes, Delete"
        onConfirm={handleConfirm}
        onClose={handleClose}
      />
    );

    const confirmBtn = screen.getByText('Yes, Delete');
    await user.click(confirmBtn);

    expect(handleConfirm).toHaveBeenCalledTimes(1);
    expect(handleClose).toHaveBeenCalledTimes(1);
  });

  it('calls only onClose when cancel button is clicked', async () => {
    const handleConfirm = vi.fn();
    const handleClose = vi.fn();
    const user = userEvent.setup();

    render(
      <ConfirmModal
        isOpen={true}
        title="Cancel Action"
        message="Discard changes?"
        cancelText="No, Keep"
        onConfirm={handleConfirm}
        onClose={handleClose}
      />
    );

    const cancelBtn = screen.getByText('No, Keep');
    await user.click(cancelBtn);

    expect(handleConfirm).not.toHaveBeenCalled();
    expect(handleClose).toHaveBeenCalledTimes(1);
  });
});
