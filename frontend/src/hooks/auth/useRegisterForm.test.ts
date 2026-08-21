import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import { useRegisterForm } from './useRegisterForm';

const mockNavigate = vi.fn();
vi.mock('react-router-dom', () => ({
  useNavigate: () => mockNavigate,
  useSearchParams: () => [new URLSearchParams()],
}));

const mockMutateAsync = vi.fn();
vi.mock('./useRegisterMutation', () => ({
  useRegisterMutation: () => ({
    mutateAsync: mockMutateAsync,
    isPending: false,
  }),
}));

describe('useRegisterForm', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    localStorage.clear();
  });

  it('initializes form with empty defaults', () => {
    const { result } = renderHook(() => useRegisterForm());

    expect(result.current.form.getValues()).toEqual({
      firstName: '',
      lastName: '',
      email: '',
      password: '',
    });
    expect(result.current.apiError).toBeNull();
  });

  it('submits valid registration fields and navigates to home', async () => {
    mockMutateAsync.mockResolvedValue({});

    const { result } = renderHook(() => useRegisterForm());

    act(() => {
      result.current.form.setValue('firstName', 'Jane');
      result.current.form.setValue('lastName', 'Doe');
      result.current.form.setValue('email', 'jane@launchly.app');
      result.current.form.setValue('password', 'password123');
    });

    await act(async () => {
      await result.current.onSubmit();
    });

    expect(mockMutateAsync).toHaveBeenCalledWith({
      name: 'Jane Doe',
      email: 'jane@launchly.app',
      password: 'password123',
    });
    expect(mockNavigate).toHaveBeenCalledWith('/home', { replace: true });
  });
});
