import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import { TeamMembersPanel } from '../TeamMembersPanel';

vi.mock('../../../../../store/useBotStore', () => ({
  useBotStore: () => 1,
}));

vi.mock('../../../../../store/useAuthStore', () => ({
  useAuthStore: () => ({ user: { id: 1, name: 'Test User' } }),
}));

vi.mock('../../../../../api/teamApi', () => ({
  getTeamMembersApi: vi.fn(() => Promise.resolve([])),
  inviteMemberApi: vi.fn(),
  cancelInvitationApi: vi.fn(),
  updateMemberApi: vi.fn(),
  removeMemberApi: vi.fn(),
}));

vi.mock('../../../../../components/common/SafeAvatar', () => ({
  SafeAvatar: () => <div data-testid="safe-avatar" />,
}));

vi.mock('../../../../../i18n/config', () => ({
  t: (k: string, fb?: any) => (typeof fb === 'string' ? fb : k),
  useTranslation: () => ({ t: (k: string, fb?: any) => (typeof fb === 'string' ? fb : k) }),
}));

describe('TeamMembersPanel', () => {
  it('renders team members panel', async () => {
    render(<TeamMembersPanel />);
    expect(await screen.findByText(/Члени команди|settings\.members\.title/i)).toBeInTheDocument();
  });
});
