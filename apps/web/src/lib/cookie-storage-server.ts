import { cookies } from 'next/headers';

const prefix = '@PrintFlow';

export const getCookieValue = async <T = string>(
  suffix: string,
  initialValue?: T
): Promise<T | null> => {
  const key = `${prefix}/${suffix}`;

  try {
    const cookieStore = await cookies();
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

export const setCookieValue = async <T = string>(
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
): Promise<void> => {
  const key = `${prefix}/${suffix}`;

  try {
    const cookieStore = await cookies();

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

export const deleteCookieValue = async (suffix: string): Promise<void> => {
  await setCookieValue(suffix, null);
};
