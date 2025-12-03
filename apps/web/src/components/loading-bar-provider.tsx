'use client';

import NextTopLoader from 'nextjs-toploader';

/**
 * Loading bar provider that displays a progress bar at the top of the page
 * during page transitions and navigation events.
 */
export function LoadingBarProvider() {
  return (
    <NextTopLoader
      color="hsl(var(--primary))"
      initialPosition={0.08}
      crawlSpeed={200}
      height={3}
      crawl={true}
      showSpinner={false}
      easing="ease"
      speed={200}
      shadow="0 0 10px hsl(var(--primary)),0 0 5px hsl(var(--primary))"
    />
  );
}
