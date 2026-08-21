import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import { ChatSidebar } from './ChatSidebar';

vi.mock('../../../../i18n/config', () => ({
  t: (k: string, fb?: string) => fb || k,
  useTranslation: () => ({ t: (k: string, fb?: string) => fb || k })
}));

describe('ChatSidebar', () => {
  it('renders sidebar tabs', () => {
    render(
      <ChatSidebar
        sidebarTab="all"
        onTabChange={vi.fn()}
        conversationsCount={10}
        labels={[]}
        showAddLabel={false}
        onShowAddLabel={vi.fn()}
        newLabelName=""
        onNewLabelNameChange={vi.fn()}
        onAddLabel={vi.fn()}
        collapsed={false}
        onCollapse={vi.fn()}
      />
    );
    expect(screen.getByText(/crm.sidebar.all_chats/i)).toBeInTheDocument();
  });

  it('renders label list items', () => {
    render(
      <ChatSidebar
        sidebarTab="all"
        onTabChange={vi.fn()}
        conversationsCount={10}
        labels={['Urgent']}
        showAddLabel={false}
        onShowAddLabel={vi.fn()}
        newLabelName=""
        onNewLabelNameChange={vi.fn()}
        onAddLabel={vi.fn()}
        collapsed={false}
        onCollapse={vi.fn()}
      />
    );
    expect(screen.getByText('Urgent')).toBeInTheDocument();
  });
});
