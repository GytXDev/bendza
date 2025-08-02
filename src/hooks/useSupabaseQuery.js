import { useState, useEffect, useCallback, useRef } from 'react';
import { supabase } from '../lib/supabase';

const cache = new Map();
const CACHE_DURATION = 5 * 60 * 1000; // 5 minutes

export const useSupabaseQuery = (queryKey, queryFn, options = {}) => {
    const [data, setData] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const abortControllerRef = useRef(null);

    const {
        enabled = true,
        cacheTime = CACHE_DURATION,
        refetchOnWindowFocus = false,
        ...queryOptions
    } = options;

    const executeQuery = useCallback(async () => {
        if (!enabled) {
            setLoading(false);
            return;
        }

        // Check cache first
        const cacheKey = typeof queryKey === 'string' ? queryKey : JSON.stringify(queryKey);
        const cachedData = cache.get(cacheKey);

        if (cachedData && Date.now() - cachedData.timestamp < cacheTime) {
            setData(cachedData.data);
            setLoading(false);
            setError(null);
            return;
        }

        // Cancel previous request if still pending
        if (abortControllerRef.current) {
            abortControllerRef.current.abort();
        }

        // Create new abort controller
        abortControllerRef.current = new AbortController();

        try {
            setLoading(true);
            setError(null);

            const result = await queryFn(supabase, abortControllerRef.current.signal);

            // Cache the result
            cache.set(cacheKey, {
                data: result,
                timestamp: Date.now()
            });

            setData(result);
        } catch (err) {
            if (err.name !== 'AbortError') {
                setError(err);
                console.error('Supabase query error:', err);
            }
        } finally {
            setLoading(false);
        }
    }, [queryKey, queryFn, enabled, cacheTime]);

    useEffect(() => {
        executeQuery();

        return () => {
            if (abortControllerRef.current) {
                abortControllerRef.current.abort();
            }
        };
    }, [executeQuery]);

    // Refetch function
    const refetch = useCallback(() => {
        const cacheKey = typeof queryKey === 'string' ? queryKey : JSON.stringify(queryKey);
        cache.delete(cacheKey);
        executeQuery();
    }, [queryKey, executeQuery]);

    // Clear cache function
    const clearCache = useCallback(() => {
        cache.clear();
    }, []);

    return {
        data,
        loading,
        error,
        refetch,
        clearCache
    };
};

// Utility function to create optimized queries
export const createOptimizedQuery = (table, select = '*', filters = {}) => {
    return async (supabase, signal) => {
        let query = supabase.from(table).select(select);

        // Apply filters
        Object.entries(filters).forEach(([key, value]) => {
            if (value !== undefined && value !== null) {
                query = query.eq(key, value);
            }
        });

        const { data, error } = await query;

        if (error) {
            throw error;
        }

        return data;
    };
}; 