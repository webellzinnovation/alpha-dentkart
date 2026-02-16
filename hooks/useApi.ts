import { useState, useCallback, useRef, useEffect } from 'react';
import axios, { AxiosRequestConfig, AxiosError, CancelTokenSource } from 'axios';

interface UseApiState<T> {
    data: T | null;
    loading: boolean;
    error: string | null;
}

interface UseApiReturn<T> extends UseApiState<T> {
    execute: (config?: AxiosRequestConfig) => Promise<T | null>;
    cancel: () => void;
    reset: () => void;
}

/**
 * useApi — Custom hook for API calls with:
 * - Automatic request cancellation on unmount (prevents memory leaks)
 * - Request deduplication (cancels previous in-flight request)
 * - Loading/error state management
 * - TypeScript generics for response typing
 *
 * @example
 * const { data, loading, error, execute } = useApi<Product[]>('/api/products');
 *
 * useEffect(() => { execute(); }, []);
 *
 * // With custom config:
 * execute({ params: { page: 2, limit: 10 } });
 */
export function useApi<T = any>(
    url: string,
    defaultConfig?: AxiosRequestConfig
): UseApiReturn<T> {
    const [state, setState] = useState<UseApiState<T>>({
        data: null,
        loading: false,
        error: null,
    });

    const cancelSourceRef = useRef<CancelTokenSource | null>(null);
    const mountedRef = useRef(true);

    // Cancel any in-flight request
    const cancel = useCallback(() => {
        if (cancelSourceRef.current) {
            cancelSourceRef.current.cancel('Request cancelled');
            cancelSourceRef.current = null;
        }
    }, []);

    // Reset state
    const reset = useCallback(() => {
        setState({ data: null, loading: false, error: null });
    }, []);

    // Execute the API call
    const execute = useCallback(
        async (overrideConfig?: AxiosRequestConfig): Promise<T | null> => {
            // Cancel any previous in-flight request (deduplication)
            cancel();

            // Create new cancel token
            const source = axios.CancelToken.source();
            cancelSourceRef.current = source;

            setState((prev) => ({ ...prev, loading: true, error: null }));

            try {
                const response = await axios({
                    url,
                    method: 'GET',
                    withCredentials: true,
                    ...defaultConfig,
                    ...overrideConfig,
                    cancelToken: source.token,
                });

                // Only update state if component is still mounted
                if (mountedRef.current) {
                    setState({ data: response.data, loading: false, error: null });
                }

                return response.data;
            } catch (err) {
                // Don't update state for cancelled requests
                if (axios.isCancel(err)) {
                    return null;
                }

                const errorMessage =
                    err instanceof AxiosError
                        ? err.response?.data?.error || err.message
                        : 'An unexpected error occurred';

                if (mountedRef.current) {
                    setState({ data: null, loading: false, error: errorMessage });
                }

                return null;
            }
        },
        [url, defaultConfig, cancel]
    );

    // Cleanup on unmount
    useEffect(() => {
        mountedRef.current = true;
        return () => {
            mountedRef.current = false;
            cancel();
        };
    }, [cancel]);

    return { ...state, execute, cancel, reset };
}
