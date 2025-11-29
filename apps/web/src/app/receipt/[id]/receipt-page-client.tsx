'use client';

import { Budget } from '@magic-system/schemas';
import { Printer } from 'lucide-react';
import { useEffect, useRef } from 'react';
import { useReactToPrint } from 'react-to-print';

import { Button } from '@/components/ui/button';

import { SalesReceipt } from './sales-receipt';

interface ReceiptPageClientProps {
  budget: Budget;
}

export function ReceiptPageClient({ budget }: ReceiptPageClientProps) {
  const receiptRef = useRef<HTMLDivElement>(null);
  const hasPrinted = useRef(false);

  const handlePrint = useReactToPrint({
    contentRef: receiptRef,
    documentTitle: `Recibo-${budget.code}`,
  });

  useEffect(() => {
    // Auto-print on page load (only once)
    if (!hasPrinted.current) {
      hasPrinted.current = true;
      // Small delay to ensure component is fully rendered
      const timer = setTimeout(() => {
        handlePrint();
      }, 500);
      return () => clearTimeout(timer);
    }
  }, [handlePrint]);

  return (
    <div className="min-h-screen bg-foreground/10 print:bg-white">
      {/* Print controls - hidden when printing */}
      <div className="print:hidden bg-background shadow-sm border-b sticky top-0 z-10">
        <div className="max-w-[210mm] mx-auto px-4 py-3 flex items-center justify-between">
          <h1 className="text-lg font-semibold">Recibo de Venda #{budget.code}</h1>
          <Button onClick={() => handlePrint()} className="gap-2">
            <Printer className="h-4 w-4" />
            Imprimir
          </Button>
        </div>
      </div>

      {/* Receipt content */}
      <div className="py-8 print:py-0">
        <SalesReceipt ref={receiptRef} budget={budget} />
      </div>
    </div>
  );
}
