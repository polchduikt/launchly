import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import { useLoginForm } from '../useLoginForm';

const mockNavigate = vi.fn();
vi.mock('react-router-dom', () => ({
  useNavigate: () => mockNavigate,
  useSearchParams: () => [new URLSearchParams()],
}));

const mockMutateAsync = vi.fn();
vi.mock('../useLoginMutation', () => ({
  useLoginMutation: () => ({
    mutateAsync: mockMutateAsync,
    isPending: false,
  }),
}));

describe('useLoginForm', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    localStorage.clear();
  });

  it('initializes form with empty defaults', () => {
    const { result } = renderHook(() => useLoginForm());

    expect(result.current.form.getValues()).toEqual({
      email: '',
      password: '',
    });
    expect(result.current.apiError).toBeNull();
  });

  it('submits valid credentials and navigates home for regular user', async () => {
    mockMutateAsync.mockResolvedValue({
      user: { role: 'ROLE_USER' },
    });

    const { result } = renderHook(() => useLoginForm());

    await act(async () => {
      await result.current.onSubmit({
        preventDefault: vi.fn(),
      } as unknown as never);
    });

    act(() => {
      result.current.form.setValue('email', 'test@launchly.app');
      result.current.form.setValue('password', 'secret123');
    });

    await act(async () => {
      await result.current.onSubmit();
    });

    expect(mockMutateAsync).toHaveBeenCalledWith({
      email: 'test@launchly.app',
      password: 'secret123',
    });
    expect(mockNavigate).toHaveBeenCalledWith('/home', { replace: true });
  });

  it('navigates to admin home when role is ROLE_ADMIN', async () => {
    mockMutateAsync.mockResolvedValue({
      user: { role: 'ROLE_ADMIN' },
    });

    const { result } = renderHook(() => useLoginForm());

    act(() => {
      result.current.form.setValue('email', 'admin@launchly.app');
      result.current.form.setValue('password', 'admin123');
    });

    await act(async () => {
      await result.current.onSubmit();
    });

    expect(mockNavigate).toHaveBeenCalledWith('/admin', { replace: true });
  });
});
