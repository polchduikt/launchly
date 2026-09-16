import { useState, useCallback } from 'react';

export const useAdminSelection = <T extends { id: number | string }>(items: T[] = []) => {
  const [selectedIds, setSelectedIds] = useState<Array<T['id']>>([]);

  const isAllSelected = items.length > 0 && items.every((i) => selectedIds.includes(i.id));

  const toggleSelectAll = useCallback(() => {
    if (isAllSelected) {
      setSelectedIds([]);
    } else {
      setSelectedIds(items.map((i) => i.id));
    }
  }, [isAllSelected, items]);

  const toggleSelect = useCallback((id: T['id']) => {
    setSelectedIds((prev) =>
      prev.includes(id) ? prev.filter((item) => item !== id) : [...prev, id]
    );
  }, []);

  const clearSelection = useCallback(() => {
    setSelectedIds([]);
  }, []);

  return {
    selectedIds,
    setSelectedIds,
    isAllSelected,
    toggleSelectAll,
    toggleSelect,
    clearSelection,
  };
};
