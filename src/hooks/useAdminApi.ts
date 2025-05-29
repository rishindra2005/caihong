'use client';

import { useRouter } from 'next/navigation';

export function useAdminApi() {
  const router = useRouter();

  const fetchWithAuth = async (url: string, options: RequestInit = {}) => {
    const response = await fetch(url, {
      ...options,
      headers: {
        ...options.headers,
        'Content-Type': 'application/json',
      },
      credentials: 'include',
    });

    if (response.status === 401) {
      router.push('/admin/login');
      throw new Error('Unauthorized');
    }

    return response;
  };

  return { fetchWithAuth };
} 