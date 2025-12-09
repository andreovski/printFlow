import { type ClassValue, clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

const entityMap: Record<string, string> = {
  '&amp;': '&',
  '&lt;': '<',
  '&gt;': '>',
  '&quot;': '"',
  '&#39;': "'",
  '&nbsp;': ' ',
};

export function stripHtml(html: string): string {
  if (!html) return '';

  // Remove HTML tags
  let text = html.replace(/<[^>]*>/g, ' ');

  // Decode common entities using simple replace for better performance
  // This covers the most common cases without overhead of DOM creation
  text = text.replace(/&[a-z0-9#]+;/g, (entity) => {
    return entityMap[entity] || entity;
  });

  return text.replace(/\s+/g, ' ').trim();
}
