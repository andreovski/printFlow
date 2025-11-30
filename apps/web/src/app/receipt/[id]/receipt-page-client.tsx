'use client';

import { Budget } from '@magic-system/schemas';
import { FileText, Printer, Receipt } from 'lucide-react';
import { useCallback, useRef, useState } from 'react';
import { useReactToPrint } from 'react-to-print';

import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

import { SalesReceipt } from './sales-receipt';
import { ThermalReceipt } from './thermal-receipt';

type PrintFormat = 'a4' | 'thermal';

interface ReceiptPageClientProps {
  budget: Budget;
}

export function ReceiptPageClient({ budget }: ReceiptPageClientProps) {
  const [printFormat, setPrintFormat] = useState<PrintFormat>('a4');
  const receiptRef = useRef<HTMLDivElement>(null);

  const handleFormatChange = (format: PrintFormat) => {
    setPrintFormat(format);
  };

  const handlePrint = useReactToPrint({
    contentRef: receiptRef,
    documentTitle: `Recibo-${budget.code}`,
    pageStyle:
      printFormat === 'thermal'
        ? `
        @page {
          size: 50mm auto;
          margin: 0;
        }
        @media print {
          body {
            margin: 0;
            padding: 0;
          }
        }
      `
        : undefined,
  });

  const triggerPrint = useCallback(() => {
    handlePrint();
  }, [handlePrint]);

  return (
    <div className="min-h-screen bg-foreground/10 print:bg-white">
      {/* Print controls - hidden when printing */}
      <div className="print:hidden bg-background shadow-sm border-b sticky top-0 z-10">
        <div className="max-w-[210mm] mx-auto px-4 py-3 flex items-center justify-between gap-4">
          <h1 className="text-lg font-semibold">Recibo de Venda #{budget.code}</h1>

          <div className="flex items-center gap-4">
            <div className="flex border rounded-md overflow-hidden">
              <button
                type="button"
                onClick={() => handleFormatChange('a4')}
                className={cn(
                  'flex items-center gap-2 px-3 py-2 text-sm font-medium transition-colors',
                  printFormat === 'a4'
                    ? 'bg-primary text-primary-foreground'
                    : 'bg-background hover:bg-muted'
                )}
              >
                <FileText className="h-4 w-4" />
                <span className="hidden sm:inline">A4</span>
              </button>
              <button
                type="button"
                onClick={() => handleFormatChange('thermal')}
                className={cn(
                  'flex items-center gap-2 px-3 py-2 text-sm font-medium transition-colors border-l',
                  printFormat === 'thermal'
                    ? 'bg-primary text-primary-foreground'
                    : 'bg-background hover:bg-muted'
                )}
              >
                <Receipt className="h-4 w-4" />
                <span className="hidden sm:inline">Térmica (50mm)</span>
              </button>
            </div>

            <Button onClick={() => triggerPrint()} className="gap-2">
              <Printer className="h-4 w-4" />
              Imprimir
            </Button>
          </div>
        </div>
      </div>

      {/* Receipt content */}
      <div className="py-8 print:py-0">
        {printFormat === 'a4' ? (
          <SalesReceipt ref={receiptRef} budget={budget} />
        ) : (
          <ThermalReceipt ref={receiptRef} budget={budget} />
        )}
      </div>
    </div>
  );
}
