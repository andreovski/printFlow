import { Loader2 } from 'lucide-react';

/**
 * Loading state for the register module.
 * Displayed during server-side rendering or page transitions.
 */
export default function RegisterLoading() {
  return (
    <div className="flex h-full items-center justify-center">
      <div className="flex flex-col items-center gap-4">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
        <p className="text-sm text-muted-foreground">Carregando cadastros...</p>
      </div>
    </div>
  );
}
