import { notFound, redirect } from 'next/navigation';

import { api } from '@/app/http/api';

interface ShortUrlPageProps {
  params: Promise<{ code: string }>;
}

interface ShortUrlResponse {
  targetUrl: string;
}

export default async function ShortUrlRedirectPage({ params }: ShortUrlPageProps) {
  const { code } = await params;

  let targetUrl: string | null = null;

  try {
    // Call API to get the target URL and track click
    const response = await api.get(`short-url/${code}`).json<ShortUrlResponse>();
    targetUrl = response.targetUrl;
  } catch {
    // If not found or error, show 404
    notFound();
  }

  // Redirect must be outside try-catch because it throws internally
  if (targetUrl) {
    redirect(targetUrl);
  }

  notFound();
}
