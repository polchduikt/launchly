import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import { NotificationsPanel } from './NotificationsPanel';

vi.mock('../../../../store/useAuthStore', () => ({
  useAuthStore: () => ({
    user: {
      notifyEmail: true,
      notifyTelegram: false,
      statsNotificationsEnabled: false,
    },
    setUser: vi.fn(),
  }),
}));

vi.mock('../../../../api/auth', () => ({
  updateNotificationsApi: vi.fn(),
  unlinkTelegramApi: vi.fn(),
}));

vi.mock('../../../public/Login/components/TelegramLoginModal', () => ({
  TelegramLoginModal: () => <div data-testid="telegram-modal" />,
}));

vi.mock('../../../../i18n/config', () => ({
  t: (k: string, fb?: string) => (typeof fb === 'string' ? fb : k),
  useTranslation: () => ({ t: (k: string, fb?: string) => (typeof fb === 'string' ? fb : k) }),
}));

vi.mock('../../../../utils/avatar', () => ({
  isValidAvatarUrl: vi.fn(() => true),
  getInitials: vi.fn(() => 'TU'),
}));

describe('NotificationsPanel', () => {
  it('renders notification settings', () => {
    render(<NotificationsPanel />);
    expect(screen.getByText('settings.notifications.notify_assignees')).toBeInTheDocument();
    expect(screen.getByText('settings.notifications.stats_report')).toBeInTheDocument();
    expect(screen.getByText('settings.notifications.desktop_title')).toBeInTheDocument();
  });
});
