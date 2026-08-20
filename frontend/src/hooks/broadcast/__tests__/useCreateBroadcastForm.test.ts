import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import { useCreateBroadcastForm } from '../useCreateBroadcastForm';

const mockNavigate = vi.fn();
vi.mock('react-router-dom', () => ({
  useNavigate: () => mockNavigate,
}));

const mockMutate = vi.fn((payload, options) => {
  if (options?.onSuccess) {
    options.onSuccess({ id: 99, ...payload });
  }
});

vi.mock('../useBroadcastQueries', () => ({
  useCreateCampaignMutation: () => ({
    mutate: mockMutate,
    isPending: false,
    error: null,
  }),
}));

describe('useCreateBroadcastForm', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('initializes form with defaults', () => {
    const { result } = renderHook(() => useCreateBroadcastForm(1));

    expect(result.current.form.getValues()).toEqual({
      name: '',
      message: '',
      filterType: 'ALL',
      filterValue: '',
      scheduledAt: '',
    });
    expect(result.current.isPending).toBe(false);
  });

  it('submits valid broadcast campaign and navigates to broadcast builder', async () => {
    const onSuccess = vi.fn();
    const { result } = renderHook(() => useCreateBroadcastForm(1, onSuccess));

    act(() => {
      result.current.form.setValue('name', 'Summer Sale');
      result.current.form.setValue('message', 'Check out discounts');
      result.current.form.setValue('filterType', 'ALL');
    });

    await act(async () => {
      await result.current.onSubmit();
    });

    expect(mockMutate).toHaveBeenCalled();
    expect(onSuccess).toHaveBeenCalled();
    expect(mockNavigate).toHaveBeenCalledWith('/broadcasts/99');
  });
});
