'use client';

import { Template, TemplateScope } from '@magic-system/schemas';
import { FileText, Loader2 } from 'lucide-react';
import * as React from 'react';

import { Badge } from '@/components/ui/badge';
import { ScrollArea, ScrollBar } from '@/components/ui/scroll-area';
import { useTemplatesWithGlobal } from '@/app/http/hooks';
import { cn } from '@/lib/utils';

interface TemplateSelectorProps {
  scope: TemplateScope;
  onSelect: (template: Template) => void;
  className?: string;
}

export function TemplateSelector({ scope, onSelect, className }: TemplateSelectorProps) {
  // Usar React Query para buscar templates (com cache automático)
  const { data: templates = [], isLoading } = useTemplatesWithGlobal(scope);

  if (isLoading) {
    return (
      <div className={cn('flex items-center gap-2 text-sm text-muted-foreground', className)}>
        <Loader2 className="h-4 w-4 animate-spin" />
        <span>Carregando templates...</span>
      </div>
    );
  }

  if (templates.length === 0) {
    return null;
  }

  return (
    <div className={cn('space-y-1.5', className)}>
      <span className="text-xs text-muted-foreground">Usar template:</span>
      <ScrollArea className="w-full whitespace-nowrap">
        <div className="flex gap-2 pb-2">
          {templates.map((template) => (
            <Badge
              key={template.id}
              variant="secondary"
              className="cursor-pointer hover:bg-primary hover:text-primary-foreground transition-colors shrink-0 gap-1.5 text-primary"
              onClick={() => onSelect(template)}
            >
              <FileText className="h-3 w-3" />
              {template.name}
            </Badge>
          ))}
        </div>
        <ScrollBar orientation="horizontal" />
      </ScrollArea>
    </div>
  );
}
