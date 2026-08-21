import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import { GeneralPanel } from './GeneralPanel';

vi.mock('../../../../hooks/auth/useLogoutMutation', () => ({
  useLogoutMutation: () => ({
    mutate: vi.fn(),
    isPending: false,
  }),
}));

describe('GeneralPanel', () => {
  it('renders panel with expected UI elements', () => {
    render(<GeneralPanel />);
    expect(screen.getByText('Часовий пояс акаунту')).toBeInTheDocument();
    expect(screen.getByText('Клонувати в інший акаунт')).toBeInTheDocument();
    expect(screen.getByText('Використовувати як шаблон')).toBeInTheDocument();
    expect(screen.getByText('Залишити акаунт')).toBeInTheDocument();
    expect(screen.getAllByText('Вийти з профілю')[0]).toBeInTheDocument();
    expect(screen.getByText('Видалити акаунт')).toBeInTheDocument();
  });
});
