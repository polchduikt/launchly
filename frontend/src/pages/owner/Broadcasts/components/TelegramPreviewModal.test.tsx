import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { TelegramPreviewModal } from './TelegramPreviewModal';

describe('TelegramPreviewModal Component', () => {
  it('does not render when isPreviewOpen is false', () => {
    render(
      <TelegramPreviewModal
        isPreviewOpen={false}
        setIsPreviewOpen={vi.fn()}
        messageText="Exclusive Offer"
      />
    );
    expect(screen.queryByText('Launchly Bot')).not.toBeInTheDocument();
  });

  it('renders simulated Telegram phone screen and text preview', async () => {
    const handleClose = vi.fn();
    const user = userEvent.setup();

    render(
      <TelegramPreviewModal
        isPreviewOpen={true}
        setIsPreviewOpen={handleClose}
        messageText="Exclusive Offer 50% Off!"
      />
    );

    expect(screen.getByText('Launchly Bot')).toBeInTheDocument();
    expect(screen.getByText('Exclusive Offer 50% Off!')).toBeInTheDocument();

    const closeBtn = screen.getByRole('button', { name: /close|закрити/i });
    await user.click(closeBtn);
    expect(handleClose).toHaveBeenCalledWith(false);
  });
});
