import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { ChatHeader } from './ChatHeader';

describe('ChatHeader Component', () => {
  it('renders search input and emits changes', async () => {
    const handleSearchChange = vi.fn();
    const handleOpenSettings = vi.fn();
    const user = userEvent.setup();

    render(
      <ChatHeader
        searchQuery="John"
        onSearchChange={handleSearchChange}
        onOpenSettings={handleOpenSettings}
      />
    );

    const input = screen.getByDisplayValue('John');
    expect(input).toBeInTheDocument();

    await user.type(input, ' Doe');
    expect(handleSearchChange).toHaveBeenCalled();

    const settingsBtn = screen.getByTitle('Notification settings');
    await user.click(settingsBtn);
    expect(handleOpenSettings).toHaveBeenCalledTimes(1);
  });
});
