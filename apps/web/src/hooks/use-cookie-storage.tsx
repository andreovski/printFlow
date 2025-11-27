'use client';

import { useEffect, useState } from 'react';

const prefix = '@PrintFlow';

interface CookieOptions {
  days?: number;
  path?: string;
  domain?: string;
  secure?: boolean;
  sameSite?: 'Strict' | 'Lax' | 'None';
}

export const useCookieStorage = <T = string,>(
  suffix: string,
  initialValue?: T,
  options: CookieOptions = {}
) => {
  const key = `${prefix}/${suffix}`;
  const defaultOptions: CookieOptions = {
    days: 365,
    path: '/',
    sameSite: 'Lax',
    ...options,
  };

  const getCookie = (name: string): string | null => {
    if (typeof document === 'undefined') {
      return null;
    }

    const nameEQ = name + '=';
    const cookies = document.cookie.split(';');

    for (let i = 0; i < cookies.length; i++) {
      let cookie = cookies[i];
      while (cookie.charAt(0) === ' ') {
        cookie = cookie.substring(1, cookie.length);
      }
      if (cookie.indexOf(nameEQ) === 0) {
        return decodeURIComponent(cookie.substring(nameEQ.length, cookie.length));
      }
    }
    return null;
  };

  const setCookie = (name: string, value: string, options: CookieOptions) => {
    if (typeof document === 'undefined') {
      return;
    }

    let cookieString = `${name}=${encodeURIComponent(value)}`;

    if (options.days) {
      const date = new Date();
      date.setTime(date.getTime() + options.days * 24 * 60 * 60 * 1000);
      cookieString += `; expires=${date.toUTCString()}`;
    }

    if (options.path) {
      cookieString += `; path=${options.path}`;
    }

    if (options.domain) {
      cookieString += `; domain=${options.domain}`;
    }

    if (options.secure) {
      cookieString += '; secure';
    }

    if (options.sameSite) {
      cookieString += `; SameSite=${options.sameSite}`;
    }

    document.cookie = cookieString;
  };

  const deleteCookie = (name: string, options: CookieOptions) => {
    if (typeof document === 'undefined') {
      return;
    }

    setCookie(name, '', { ...options, days: -1 });
  };

  const getStoredValue = (): T | null => {
    if (typeof document === 'undefined') {
      return null;
    }

    try {
      const item = getCookie(key);
      return item ? (JSON.parse(item) as T) : (initialValue ?? null);
    } catch (error) {
      console.error(`Error reading cookie "${key}":`, error);
      return initialValue ?? null;
    }
  };

  // Always initialize with null to avoid hydration mismatch
  const [value, setValue] = useState<T | null>(null);

  // Sync with cookies after mount (client-side only)
  useEffect(() => {
    const storedValue = getStoredValue();
    setValue(storedValue);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const setStoredValue = (newValue: T | null) => {
    try {
      setValue(newValue);

      if (typeof document !== 'undefined') {
        if (newValue === null) {
          deleteCookie(key, defaultOptions);
        } else {
          setCookie(key, JSON.stringify(newValue), defaultOptions);
        }
      }
    } catch (error) {
      console.error(`Error setting cookie "${key}":`, error);
    }
  };

  const getValue = (): T | null => {
    return value;
  };

  const removeValue = () => {
    setStoredValue(null);
  };

  return { value, setValue: setStoredValue, getValue, removeValue };
};
