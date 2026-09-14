import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { CooldownNodeEditor } from './CooldownNodeEditor';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';

vi.mock('../../../../../../i18n/config', () => ({
  t: (k: string, fb?: string) => (typeof fb === 'string' ? fb : k),
  useTranslation: () => ({ t: (k: string, fb?: string) => (typeof fb === 'string' ? fb : k) }),
}));

vi.mock('../../../../../../store/useBotStore', () => ({
  useBotStore: (selector?: (state: Record<string, unknown>) => unknown) => selector ? selector({ activeBotId: 1 }) : ({ activeBotId: 1 }),
}));

vi.mock('../../../../../../hooks/broadcast/useBroadcastQueries', () => ({
  useTagsQuery: () => ({ data: [] }),
}));

vi.mock('../../../../../../hooks/bot/useCustomFieldsQuery', () => ({
  useCustomFieldsQuery: () => ({ data: { fields: [] } }),
}));

const qc = new QueryClient({ defaultOptions: { queries: { retry: false } } });
const Wrapper = ({ children }: { children: React.ReactNode }) => (
  <QueryClientProvider client={qc}>{children}</QueryClientProvider>
);

describe('CooldownNodeEditor', () => {
  it('renders duration inputs and message container', () => {
    const handleChange = vi.fn();
    render(
      <CooldownNodeEditor
        data={{
          duration: 5,
          unit: 'MINUTES',
          blockMessage: 'Зачекайте ще {remaining} перед повторною спробою!',
        }}
        handleChange={handleChange}
      />,
      { wrapper: Wrapper }
    );

    expect(screen.getByDisplayValue('5')).toBeInTheDocument();
    expect(screen.getByText(/editor.cooldown.message_label|Повідомлення при блокуванні/i)).toBeInTheDocument();
  });

  it('shows toolbar with 4 actions when contentEditable is focused', () => {
    const handleChange = vi.fn();
    const { container } = render(
      <CooldownNodeEditor
        data={{
          duration: 1,
          unit: 'MINUTES',
          blockMessage: 'Зачекайте ще {remaining} перед повторною спробою!',
        }}
        handleChange={handleChange}
      />,
      { wrapper: Wrapper }
    );

    const editable = container.querySelector('[contenteditable="true"]');
    expect(editable).toBeInTheDocument();

    expect(screen.queryByTitle(/editor.message.toolbar_link|Посилання/i)).not.toBeInTheDocument();

    fireEvent.focus(editable!);

    expect(screen.getByTitle(/editor.message.toolbar_link|Посилання/i)).toBeInTheDocument();
    expect(screen.getByTitle(/editor.message.toolbar_emoji|Емодзі/i)).toBeInTheDocument();
    expect(screen.getByTitle(/editor.message.toolbar_variables|Змінні/i)).toBeInTheDocument();
    expect(screen.getByText(/1951/)).toBeInTheDocument();

    fireEvent.click(screen.getByTitle(/editor.message.toolbar_variables|Змінні/i));
    const nodeTab = screen.getByText(/editor.gs.node_variables|Змінні вузла/i);
    expect(nodeTab).toBeInTheDocument();
    fireEvent.click(nodeTab);
    expect(screen.getAllByText(/editor.cooldown.variable_remaining|Час очікування/i).length).toBeGreaterThanOrEqual(2);
  });
});
