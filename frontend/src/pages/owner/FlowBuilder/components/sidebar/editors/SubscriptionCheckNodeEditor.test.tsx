import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { SubscriptionCheckNodeEditor } from './SubscriptionCheckNodeEditor';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';

vi.mock('../../../../../../i18n/config', () => ({
  t: (k: string, fb?: string) => (typeof fb === 'string' ? fb : k),
  useTranslation: () => ({ t: (k: string, fb?: string) => (typeof fb === 'string' ? fb : k) }),
}));

import { ReactFlowProvider } from '@xyflow/react';

const qc = new QueryClient({ defaultOptions: { queries: { retry: false } } });
const Wrapper = ({ children }: { children: React.ReactNode }) => (
  <ReactFlowProvider>
    <QueryClientProvider client={qc}>{children}</QueryClientProvider>
  </ReactFlowProvider>
);

describe('SubscriptionCheckNodeEditor', () => {
  it('renders mode buttons, channel list and adds a new channel', () => {
    const handleChange = vi.fn();
    render(
      <SubscriptionCheckNodeEditor
        data={{
          mode: 'all',
          channels: [{ id: 'ch_1', channelId: '@mychannel', name: 'My Channel', isRequired: true }],
        }}
        handleChange={handleChange}
      />,
      { wrapper: Wrapper }
    );

    expect(screen.getByText('Усі канали')).toBeInTheDocument();
    expect(screen.getByDisplayValue('@mychannel')).toBeInTheDocument();
  });

  it('switches check strategy mode', () => {
    const handleChange = vi.fn();
    render(
      <SubscriptionCheckNodeEditor
        data={{ mode: 'all', channels: [] }}
        handleChange={handleChange}
      />,
      { wrapper: Wrapper }
    );

    const anyModeBtn = screen.getByText('Хоча б один');
    fireEvent.click(anyModeBtn);
    expect(handleChange).toHaveBeenCalledWith('mode', 'any');
  });
});
