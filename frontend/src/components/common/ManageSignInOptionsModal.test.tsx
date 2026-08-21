import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import { ManageSignInOptionsModal } from './ManageSignInOptionsModal';

vi.mock('../../store/useAuthStore', () => ({
  useAuthStore: (selector?: (state: Record<string, unknown>) => unknown) => selector ? selector({
    user: { provider: 'GOOGLE', email: 'test@gmail.com', telegramUserId: '123' },
    setUser: vi.fn(),
  }) : ({
    user: { provider: 'GOOGLE', email: 'test@gmail.com', telegramUserId: '123' },
    setUser: vi.fn(),
  }),
}));

vi.mock('../../api/auth', () => ({
  unlinkTelegramApi: vi.fn(),
}));

vi.mock('../../pages/public/Login/components/TelegramLoginModal', () => ({
  TelegramLoginModal: () => <div data-testid="telegram-login-modal" />,
}));

vi.mock('../../i18n/config', () => ({
  t: (k: string, fb?: string) => fb || k,
  useTranslation: () => ({ t: (k: string, fb?: string) => fb || k }),
}));

describe('ManageSignInOptionsModal', () => {
  it('returns null when isOpen is false', () => {
    const { container } = render(<ManageSignInOptionsModal isOpen={false} onClose={() => {}} />);
    expect(container).toBeEmptyDOMElement();
  });

  it('renders modal when isOpen is true', () => {
    render(<ManageSignInOptionsModal isOpen={true} onClose={() => {}} />);
    expect(screen.getByText('auth.signin.manage_title')).toBeInTheDocument();
  });
});
