import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { GoogleSheetsCard } from './GoogleSheetsCard';

const queryClient = new QueryClient({
  defaultOptions: { queries: { retry: false } },
});

describe('GoogleSheetsCard Component', () => {
  it('renders disconnected state with connect button', () => {
    render(
      <QueryClientProvider client={queryClient}>
        <GoogleSheetsCard botId={10} integration={undefined} />
      </QueryClientProvider>
    );

    expect(screen.getAllByText(/Google Sheets/i)[0]).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /Connect|Підключити/i })).toBeInTheDocument();
  });

  it('renders connected state with account email and delete button', () => {
    const mockIntegration = {
      id: 1,
      name: 'Google Sheets',
      type: 'GOOGLE_SHEETS',
      active: true,
      config: JSON.stringify({ email: 'owner@gmail.com' }),
      botId: 10,
      createdAt: '2026-08-20T00:00:00Z',
      updatedAt: '2026-08-20T00:00:00Z',
    };

    render(
      <QueryClientProvider client={queryClient}>
        <GoogleSheetsCard botId={10} integration={mockIntegration as unknown as never} />
      </QueryClientProvider>
    );

    expect(screen.getByText('owner@gmail.com')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /Disconnect|Відключити|Видалити/i })).toBeInTheDocument();
  });
});
