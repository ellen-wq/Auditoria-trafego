import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';

interface SearchConfig {
  page: number;
  searchText: string;
  filters?: Record<string, any>;
}

interface UseGlobalSearchOptions {
  queryFn: (config: SearchConfig) => Promise<any>;
  queryKey: string[];
  enabled?: boolean;
}

export function useGlobalSearch<T = any>({
  queryFn,
  queryKey,
  enabled = true,
}: UseGlobalSearchOptions) {
  const [searchText, setSearchText] = useState('');
  const [filters, setFilters] = useState<Record<string, any>>({});
  const [page, setPage] = useState(1);

  const query = useQuery({
    queryKey: [...queryKey, searchText, filters, page],
    queryFn: () => queryFn({ page, searchText, filters }),
    enabled,
    staleTime: 30 * 1000,
  });

  return {
    ...query,
    searchText,
    setSearchText,
    filters,
    setFilters,
    page,
    setPage,
  };
}
