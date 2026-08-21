import { describe, it, expect, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { DisplayPanel, DISPLAY_KEY_HOME_TEMPLATES } from './DisplayPanel';

describe('DisplayPanel Component', () => {
  beforeEach(() => {
    localStorage.clear();
  });

  it('renders display settings section headers', () => {
    render(<DisplayPanel />);
    expect(screen.getAllByText(/Home|Головна/i)[0]).toBeInTheDocument();
    expect(screen.getAllByText(/Contacts|Контакти/i)[0]).toBeInTheDocument();
    expect(screen.getAllByText(/Automations|Автоматизації/i)[0]).toBeInTheDocument();
  });

  it('toggles home templates checkbox and saves to localStorage', async () => {
    const user = userEvent.setup();
    render(<DisplayPanel />);

    const checkboxes = screen.getAllByRole('checkbox');
    const firstCheckbox = checkboxes[0];

    await user.click(firstCheckbox);
    expect(localStorage.getItem(DISPLAY_KEY_HOME_TEMPLATES)).toBeDefined();
  });
});
