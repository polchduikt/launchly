import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { EditBroadcastDialog } from './EditBroadcastDialog';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';

vi.mock('../../../../i18n/config', () => ({
  t: (k: string) => k,
  useTranslation: () => ({ t: (k: string, fb?: string) => fb || k }),
}));

const mockMutate = vi.fn();
vi.mock('../../../../hooks/broadcast/useBroadcastQueries', () => ({
  useUpdateCampaignMutation: () => ({
    mutate: mockMutate,
    isPending: false,
    error: null,
  })
}));

describe('EditBroadcastDialog', () => {
  const defaultProps = {
    isOpen: true,
    onClose: vi.fn(),
    campaign: { id: 1, name: 'Test Campaign', message: 'Hello', targetAllBots: true } as unknown as never,
    bots: [{ id: 1, name: 'Test Bot', hasTelegramToken: true } as unknown as never],
    botId: 1,
  };

  const qc = new QueryClient({ defaultOptions: { queries: { retry: false } } });

  const renderWithProviders = (ui: React.ReactElement) =>
    render(
      <QueryClientProvider client={qc}>
        {ui}
      </QueryClientProvider>
    );

  it('returns null when not open', () => {
    const { container } = renderWithProviders(<EditBroadcastDialog {...defaultProps} isOpen={false} />);
    expect(container.firstChild).toBeNull();
  });

  it('renders with initial values', () => {
    renderWithProviders(<EditBroadcastDialog {...defaultProps} />);
    expect(screen.getByText('broadcast.dialog.edit_title')).toBeInTheDocument();
    expect(screen.getByDisplayValue('Test Campaign')).toBeInTheDocument();
    expect(screen.getByDisplayValue('Hello')).toBeInTheDocument();
  });

  it('handles close', () => {
    renderWithProviders(<EditBroadcastDialog {...defaultProps} />);
    fireEvent.click(screen.getByText('broadcast.dialog.cancel'));
    expect(defaultProps.onClose).toHaveBeenCalled();
  });
});
