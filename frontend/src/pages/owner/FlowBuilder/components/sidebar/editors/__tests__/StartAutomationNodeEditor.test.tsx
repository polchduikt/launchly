import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import { StartAutomationNodeEditor } from '../StartAutomationNodeEditor';
import { MemoryRouter } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';

vi.mock('../../../../../../../i18n/config', () => ({
  t: (k: string, fb?: any) => (typeof fb === 'string' ? fb : k),
  useTranslation: () => ({ t: (k: string, fb?: any) => (typeof fb === 'string' ? fb : k) }),
}));

vi.mock('../../../../../../../store/useBotStore', () => ({
  useBotStore: (selector: any) => selector ? selector({ activeBotId: 1, setActiveBotId: vi.fn() }) : ({ activeBotId: 1, setActiveBotId: vi.fn() }),
}));

vi.mock('../../../../../../../hooks/bot/useBotsQuery', () => ({
  useBotsQuery: () => ({ data: [], isLoading: false }),
}));

vi.mock('../../../../../../../hooks/bot/useFlowSchema', () => ({
  useFlowSchemaQuery: () => ({ data: null, isLoading: false }),
}));

const qc = new QueryClient({ defaultOptions: { queries: { retry: false } } });
const Wrapper = ({ children }: { children: React.ReactNode }) => (
  <QueryClientProvider client={qc}>
    <MemoryRouter>{children}</MemoryRouter>
  </QueryClientProvider>
);

describe('StartAutomationNodeEditor', () => {
  it('renders StartAutomationNodeEditor with select automation CTA', () => {
    render(
      <StartAutomationNodeEditor
        data={{ targetBotName: 'Welcome Bot' }}
        handleChange={vi.fn()}
      />,
      { wrapper: Wrapper }
    );

    expect(screen.getByText(/editor.automation.title|Welcome Bot/i)).toBeInTheDocument();
  });
});
