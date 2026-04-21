'use client';
import { useState, useEffect, useCallback } from 'react';

interface UseApiOptions<T> {
  fetchFn: () => Promise<T>;
  immediate?: boolean;
}

export function useApi<T>({ fetchFn, immediate = true }: UseApiOptions<T>) {
  const [data, setData] = useState<T | null>(null);
  const [isLoading, setIsLoading] = useState(immediate);
  const [error, setError] = useState<Error | null>(null);

  const execute = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const result = await fetchFn();
      setData(result);
      return result;
    } catch (err) {
      const error = err instanceof Error ? err : new Error('Unknown error');
      setError(error);
      throw error;
    } finally {
      setIsLoading(false);
    }
  }, [fetchFn]);

  useEffect(() => {
    if (immediate) {
      execute();
    }
  }, [immediate, execute]);

  const refetch = useCallback(() => {
    return execute();
  }, [execute]);

  return {
    data,
    isLoading,
    error,
    refetch,
    setData,
  };
}
