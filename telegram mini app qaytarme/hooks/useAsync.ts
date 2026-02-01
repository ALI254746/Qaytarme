import { useState, useCallback } from "react";

interface UseAsyncOptions<T> {
  onSuccess?: (data: T) => void;
  onError?: (error: Error) => void;
  retryCount?: number;
  retryDelay?: number;
}

export function useAsync<T>() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<Error | null>(null);
  const [data, setData] = useState<T | null>(null);

  const execute = useCallback(
    async (
      asyncFunction: () => Promise<T>,
      options?: UseAsyncOptions<T>
    ): Promise<T | null> => {
      setLoading(true);
      setError(null);

      const maxRetries = options?.retryCount || 0;
      let retries = 0;

      while (retries <= maxRetries) {
        try {
          const result = await asyncFunction();
          setData(result);
          setLoading(false);
          options?.onSuccess?.(result);
          return result;
        } catch (err) {
          const error = err instanceof Error ? err : new Error(String(err));
          
          if (retries < maxRetries) {
            retries++;
            const delay = options?.retryDelay || 1000;
            await new Promise((resolve) => setTimeout(resolve, delay * retries));
            continue;
          }

          setError(error);
          setLoading(false);
          options?.onError?.(error);
          return null;
        }
      }

      return null;
    },
    []
  );

  const reset = useCallback(() => {
    setLoading(false);
    setError(null);
    setData(null);
  }, []);

  return { loading, error, data, execute, reset };
}
