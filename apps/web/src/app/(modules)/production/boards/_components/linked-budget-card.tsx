'use client';

import { CardBudget, CardBudgetItem } from '@magic-system/schemas';
import {
  ChevronDown,
  ChevronUp,
  ExternalLink,
  Link as LinkIcon,
  Package,
  Printer,
} from 'lucide-react';
import Link from 'next/link';
import * as React from 'react';

interface LinkedBudgetCardProps {
  budget: CardBudget;
}

function BudgetItemRow({ item }: { item: CardBudgetItem }) {
  return (
    <div className="flex items-center justify-between py-1.5 text-sm border-b last:border-b-0 border-border/50">
      <div className="flex items-center gap-2 flex-1 min-w-0">
        <Package className="h-3.5 w-3.5 shrink-0 text-muted-foreground" />
        <span className="truncate">{item.name}</span>
      </div>
      <div className="flex items-center gap-4 shrink-0 text-muted-foreground">
        <span className="text-xs">x{item.quantity}</span>
      </div>
    </div>
  );
}

export function LinkedBudgetCard({ budget }: LinkedBudgetCardProps) {
  const [isExpanded, setIsExpanded] = React.useState(false);
  const hasItems = budget.items && budget.items.length > 0;

  return (
    <div className="bg-primary/10 rounded-md flex flex-col">
      {/* Header */}
      <div className="flex items-center justify-between pt-2 px-2">
        <p className="text-xs text-primary flex gap-1 items-center">
          <LinkIcon className="h-3 w-3 shrink-0 text-primary" />
          Orçamento Vinculado
        </p>

        <div className="flex gap-2 items-center">
          {budget.id && (
            <Link
              href={`/receipt/${budget.id}`}
              target="_blank"
              title="Imprimir Recibo"
              className="p-1 hover:bg-primary/20 rounded-md transition-colors"
            >
              <Printer className="h-3.5 w-3.5 text-primary" />
            </Link>
          )}
          <Link
            href={`/finance/budgets/${budget.id}`}
            target="_blank"
            className="p-1 hover:bg-primary/20 rounded-md transition-colors"
            title="Abrir orçamento em nova aba"
          >
            <ExternalLink className="h-3.5 w-3.5 text-primary" />
          </Link>
        </div>
      </div>

      {/* Budget Info */}
      <div className="bg-background/50 rounded-md mx-2 mt-1 mb-2 border overflow-hidden">
        <div className="flex items-center px-3 py-2 border-b border-border/50">
          <p className="font-semibold flex-1">
            #{budget.code} • {budget.client.name}
          </p>
        </div>

        {/* Products Toggle */}
        {hasItems && (
          <>
            <button
              type="button"
              onClick={() => setIsExpanded(!isExpanded)}
              className="w-full flex items-center justify-between px-3 py-1.5 text-xs text-muted-foreground hover:bg-muted/50 transition-colors"
            >
              <span className="flex items-center gap-1">
                <Package className="h-3 w-3" />
                {budget.items.length} {budget.items.length === 1 ? 'produto' : 'produtos'}
              </span>
              {isExpanded ? (
                <ChevronUp className="h-3.5 w-3.5" />
              ) : (
                <ChevronDown className="h-3.5 w-3.5" />
              )}
            </button>

            {/* Products List - Collapsible */}
            {isExpanded && (
              <div className="px-3 py-1.5 max-h-[150px] overflow-y-auto border-t border-border/50">
                {budget.items.map((item) => (
                  <BudgetItemRow key={item.id} item={item} />
                ))}
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}
