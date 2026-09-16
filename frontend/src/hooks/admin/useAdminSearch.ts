import { useState, useEffect } from 'react';
import { useDebounce } from '../useDebounce';

interface UseAdminSearchOptions {
  initialSearch?: string;
  debounceMs?: number;
}

export const useAdminSearch = ({
  initialSearch = '',
  debounceMs = 300,
}: UseAdminSearchOptions = {}) => {
  const [search, setSearch] = useState(initialSearch);
  const debouncedSearch = useDebounce(search, debounceMs);
  const [page, setPage] = useState(0);

  useEffect(() => {
    setPage(0);
  }, [debouncedSearch]);

  return {
    search,
    setSearch,
    debouncedSearch,
    page,
    setPage,
  };
};
