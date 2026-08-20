import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { PickAutomationModal } from '../PickAutomationModal';

describe('PickAutomationModal', () => {
  const defaultProps = {
    isPickOpen: true,
    setIsPickOpen: vi.fn(),
    searchQuery: '',
    setSearchQuery: vi.fn(),
    handleSelectAutomation: vi.fn(),
  };

  it('returns null when not open', () => {
    const { container } = render(<PickAutomationModal {...defaultProps} isPickOpen={false} />);
    expect(container.firstChild).toBeNull();
  });

  it('renders correctly', () => {
    render(<PickAutomationModal {...defaultProps} />);
    expect(screen.getByText('Pick Automation')).toBeInTheDocument();
    expect(screen.getByText('Telegram Welcome Message')).toBeInTheDocument();
  });

  it('handles search input', () => {
    render(<PickAutomationModal {...defaultProps} />);
    const input = screen.getByPlaceholderText('Search all Automations');
    fireEvent.change(input, { target: { value: 'test' } });
    expect(defaultProps.setSearchQuery).toHaveBeenCalledWith('test');
  });

  it('handles selection', () => {
    render(<PickAutomationModal {...defaultProps} />);
    fireEvent.click(screen.getByText('Telegram Welcome Message'));
    expect(defaultProps.handleSelectAutomation).toHaveBeenCalledWith('Telegram Welcome Message');
  });
});
