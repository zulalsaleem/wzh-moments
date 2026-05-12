import { useState, useCallback } from 'react';
import toast from 'react-hot-toast';

export function useApi(apiFn, { onSuccess, onError, successMessage } = {}) {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const execute = useCallback(async (...args) => {
    setLoading(true);
    setError(null);
    try {
      const res = await apiFn(...args);
      const result = res.data;
      setData(result);
      if (successMessage) toast.success(successMessage);
      onSuccess?.(result);
      return result;
    } catch (err) {
      const msg = err.response?.data?.message || err.message || 'Something went wrong';
      setError(msg);
      toast.error(msg);
      onError?.(err);
      throw err;
    } finally {
      setLoading(false);
    }
  }, [apiFn, onSuccess, onError, successMessage]);

  return { data, loading, error, execute };
}
