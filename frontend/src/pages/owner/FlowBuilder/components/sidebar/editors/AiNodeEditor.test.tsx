import { describe, it, expect, vi } from 'vitest';

let mockIntegrations: unknown[] = [];

vi.mock('../../../../../../i18n/config', () => ({
  t: (k: string, fb?: string) => (typeof fb === 'string' ? fb : k),
  useTranslation: () => ({ t: (k: string, fb?: string) => (typeof fb === 'string' ? fb : k) }),
}));

vi.mock('../../../../../../hooks/integration/useIntegrationQueries', () => ({
  useIntegrationsQuery: () => ({ data: mockIntegrations }),
}));

import { render, screen } from '@testing-library/react';
import { AiNodeEditor } from './AiNodeEditor';
import { MemoryRouter } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';

const qc = new QueryClient({ defaultOptions: { queries: { retry: false } } });
const Wrapper = ({ children }: { children: React.ReactNode }) => (
  <QueryClientProvider client={qc}>
    <MemoryRouter>{children}</MemoryRouter>
  </QueryClientProvider>
);

describe('AiNodeEditor', () => {
  it('renders provider required banner when no provider is active', () => {
    mockIntegrations = [];
    render(
      <AiNodeEditor
        data={{ prompt: 'Assist users', context: 'Support agent' }}
        handleChange={vi.fn()}
      />,
      { wrapper: Wrapper }
    );

    expect(screen.getByText('editor.ai.provider_required')).toBeInTheDocument();
    expect(screen.getByText('editor.ai.go_to_settings')).toBeInTheDocument();
  });

  it('renders AI goal and context fields when provider is connected', () => {
    mockIntegrations = [{ id: 1, type: 'CHATGPT', active: true }];
    render(
      <AiNodeEditor
        data={{ prompt: 'Assist users', context: 'Support agent' }}
        handleChange={vi.fn()}
      />,
      { wrapper: Wrapper }
    );

    expect(screen.getByText('editor.ai.tell_ai')).toBeInTheDocument();
    expect(screen.getByText('editor.ai.give_context')).toBeInTheDocument();
    expect(screen.getByText('editor.ai.generate')).toBeInTheDocument();
  });
});
