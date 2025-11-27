import { cookies } from 'next/headers';

const prefix = '@PrintFlow';

export const getCookieValue = <T = string>(suffix: string, initialValue?: T): T | null => {
  const key = `${prefix}/${suffix}`;

  try {
    const cookieStore = cookies();
    const cookie = cookieStore.get(key);

    if (!cookie?.value) {
      return initialValue ?? null;
    }

    return JSON.parse(decodeURIComponent(cookie.value)) as T;
  } catch (error) {
    console.error(`Error reading cookie "${key}":`, error);
    return initialValue ?? null;
  }
};

export const setCookieValue = <T = string>(
  suffix: string,
  value: T | null,
  options: {
    maxAge?: number; // seconds
    path?: string;
    domain?: string;
    secure?: boolean;
    httpOnly?: boolean;
    sameSite?: 'strict' | 'lax' | 'none';
  } = {}
): void => {
  const key = `${prefix}/${suffix}`;

  try {
    const cookieStore = cookies();

    if (value === null) {
      cookieStore.delete(key);
    } else {
      cookieStore.set(key, JSON.stringify(value), {
        maxAge: 60 * 60 * 24 * 365, // 1 year default
        path: '/',
        sameSite: 'lax',
        ...options,
      });
    }
  } catch (error) {
    console.error(`Error setting cookie "${key}":`, error);
  }
};

export const deleteCookieValue = (suffix: string): void => {
  setCookieValue(suffix, null);
};
