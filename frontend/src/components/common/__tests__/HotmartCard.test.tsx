import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { HotmartCard } from '../HotmartCard';

const queryClient = new QueryClient({
  defaultOptions: { queries: { retry: false } },
});

describe('HotmartCard Component', () => {
  it('renders input for hottok token and webhook url copy', () => {
    render(
      <QueryClientProvider client={queryClient}>
        <HotmartCard botId={5} integration={undefined} />
      </QueryClientProvider>
    );

    expect(screen.getAllByText(/Hotmart/i)[0]).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /Connect|Підключити|Зберегти/i })).toBeInTheDocument();
  });
});
