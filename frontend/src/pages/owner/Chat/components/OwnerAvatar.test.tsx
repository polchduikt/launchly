import { describe, it, expect, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import { OwnerAvatar } from './OwnerAvatar';
import { useAuthStore } from '../../../../store/useAuthStore';
import type { User } from '../../../../types/auth';

describe('OwnerAvatar Component', () => {
  beforeEach(() => {
    localStorage.clear();
    useAuthStore.getState().logout();
  });

  it('renders Me initials when user has no avatar', () => {
    const mockUser: User = {
      id: 1,
      email: 'owner@launchly.com',
      name: 'Owner Admin',
      avatar: null,
      role: 'ROLE_OWNER',
      telegramUserId: null,
      telegramUsername: null,
      telegramName: null,
      telegramPhotoUrl: null,
      notifyEmail: true,
      notifyTelegram: false,
      notificationEmail: null,
      statsNotificationsEnabled: false,
      statsDayOfWeek: 'MONDAY',
      statsHour: 9,
      statsDaysRange: 7,
      statsNotifyEmail: false,
      statsNotifyTelegram: false,
      timezone: 'UTC',
    };
    useAuthStore.getState().setUser(mockUser);

    render(<OwnerAvatar size={32} />);
    expect(screen.getByText('OA')).toBeInTheDocument();
  });

  it('renders image when user has avatar url', () => {
    const mockUser: User = {
      id: 1,
      email: 'owner@launchly.com',
      name: 'Owner Admin',
      avatar: 'https://example.com/owner.jpg',
      role: 'ROLE_OWNER',
      telegramUserId: null,
      telegramUsername: null,
      telegramName: null,
      telegramPhotoUrl: null,
      notifyEmail: true,
      notifyTelegram: false,
      notificationEmail: null,
      statsNotificationsEnabled: false,
      statsDayOfWeek: 'MONDAY',
      statsHour: 9,
      statsDaysRange: 7,
      statsNotifyEmail: false,
      statsNotifyTelegram: false,
      timezone: 'UTC',
    };
    useAuthStore.getState().setUser(mockUser);

    render(<OwnerAvatar size={32} />);
    const img = screen.getByRole('img');
    expect(img).toBeInTheDocument();
    expect(img).toHaveAttribute('src', 'https://example.com/owner.jpg');
  });
});
