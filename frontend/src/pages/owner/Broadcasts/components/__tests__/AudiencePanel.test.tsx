import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { AudiencePanel } from '../AudiencePanel';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';

vi.mock('../../../../../i18n/config', () => ({
  useTranslation: () => ({ t: (k: string, fb?: any) => (typeof fb === 'string' ? fb : k) }),
  t: (k: string, fb?: any) => (typeof fb === 'string' ? fb : k),
}));

vi.mock('../../../../../hooks/bot/useBotsQuery', () => ({
  useBotsQuery: () => ({ data: [] }),
}));

vi.mock('../../../../../store/useBotStore', () => ({
  useBotStore: (selector: any) => selector ? selector({ activeBotId: 1, setActiveBotId: vi.fn() }) : ({ activeBotId: 1, setActiveBotId: vi.fn() }),
}));

const qc = new QueryClient({ defaultOptions: { queries: { retry: false } } });
const Wrapper = ({ children }: { children: React.ReactNode }) => (
  <QueryClientProvider client={qc}>{children}</QueryClientProvider>
);

describe('AudiencePanel', () => {
  const defaultProps = {
    isAudienceOpen: false,
    setIsAudienceOpen: vi.fn(),
    getAudienceCount: () => 10,
    conditions: [],
    handleRemoveCondition: vi.fn(),
    isConditionDropdownOpen: false,
    setIsConditionDropdownOpen: vi.fn(),
    selectedCategory: 'general' as const,
    setSelectedCategory: vi.fn(),
    tags: [],
    handleAddTagCondition: vi.fn(),
    setConditions: vi.fn(),
    setIsDirty: vi.fn(),
  };

  it('renders closed state correctly', () => {
    render(<AudiencePanel {...defaultProps} />, { wrapper: Wrapper });
    expect(screen.getByText('audience.panel.target_audience')).toBeInTheDocument();
  });

  it('renders open state and allows interaction', () => {
    render(<AudiencePanel {...defaultProps} isAudienceOpen={true} />, { wrapper: Wrapper });
    expect(screen.getByText('audience.panel.targeting_desc')).toBeInTheDocument();
    
    const addConditionBtn = screen.getByText('audience.panel.add_condition');
    fireEvent.click(addConditionBtn);
    expect(defaultProps.setIsConditionDropdownOpen).toHaveBeenCalledWith(true);
  });
});
