import { Loader2 } from 'lucide-react';

/**
 * Loading state for the production module.
 * Displayed during server-side rendering or page transitions.
 */
export default function ProductionLoading() {
  return (
    <div className="flex h-full items-center justify-center">
      <div className="flex flex-col items-center gap-4">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
        <p className="text-sm text-muted-foreground">Carregando...</p>
      </div>
    </div>
  );
}
