import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderHook, act, waitFor } from '@testing-library/react';
import { useCustomFieldsData } from './useCustomFieldsData';
import { getCustomFieldsApi, saveCustomFieldsApi } from '../../api/bot';

vi.mock('../../api/bot', () => ({
  getCustomFieldsApi: vi.fn(),
  saveCustomFieldsApi: vi.fn(),
}));

const mockBots = [{ id: 1 }];

describe('useCustomFieldsData', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    (getCustomFieldsApi as ReturnType<typeof vi.fn>).mockResolvedValue({
      fields: [{ name: 'phone', type: 'Text' }],
      archivedFields: [],
      folders: [{ id: 'f1', name: 'General' }],
    });
    (saveCustomFieldsApi as ReturnType<typeof vi.fn>).mockResolvedValue({});
  });

  it('loads fields and folders for bot', async () => {
    const { result } = renderHook(() => useCustomFieldsData({ bots: mockBots, botId: 1 }));

    await waitFor(() => {
      expect(result.current.fields).toHaveLength(1);
    });

    expect(result.current.fields[0].name).toBe('phone');
    expect(result.current.folders).toHaveLength(1);
  });

  it('creates and validates new field', async () => {
    const { result } = renderHook(() => useCustomFieldsData({ bots: mockBots, botId: 1 }));

    await waitFor(() => {
      expect(result.current.fields).toHaveLength(1);
    });

    act(() => {
      const res = result.current.createField({ name: 'email', type: 'Text' });
      expect(res.success).toBe(true);
    });

    expect(result.current.fields.some((f) => f.name === 'email')).toBe(true);
  });

  it('archives and restores a field', async () => {
    const { result } = renderHook(() => useCustomFieldsData({ bots: mockBots, botId: 1 }));

    await waitFor(() => {
      expect(result.current.fields).toHaveLength(1);
    });

    act(() => {
      result.current.archiveField('phone');
    });

    expect(result.current.fields).toHaveLength(0);
    expect(result.current.archivedFields).toHaveLength(1);

    act(() => {
      result.current.unarchiveField('phone', null);
    });

    expect(result.current.fields).toHaveLength(1);
    expect(result.current.archivedFields).toHaveLength(0);
  });
});
