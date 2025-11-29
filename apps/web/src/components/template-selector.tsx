'use client';

import { Template, TemplateScope } from '@magic-system/schemas';
import { FileText, Loader2 } from 'lucide-react';
import * as React from 'react';

import { getTemplates } from '@/app/http/requests/templates';
import { Badge } from '@/components/ui/badge';
import { ScrollArea, ScrollBar } from '@/components/ui/scroll-area';
import { cn } from '@/lib/utils';

interface TemplateSelectorProps {
  scope: TemplateScope;
  onSelect: (template: Template) => void;
  className?: string;
}

export function TemplateSelector({ scope, onSelect, className }: TemplateSelectorProps) {
  const [templates, setTemplates] = React.useState<Template[]>([]);
  const [loading, setLoading] = React.useState(true);

  React.useEffect(() => {
    const fetchTemplates = async () => {
      setLoading(true);
      try {
        // Fetch templates for the specific scope and global templates
        if (scope !== 'GLOBAL') {
          const [scopedData, globalData] = await Promise.all([
            getTemplates({
              page: 1,
              pageSize: 50,
              scope: scope,
              active: true,
            }),
            getTemplates({
              page: 1,
              pageSize: 50,
              scope: 'GLOBAL',
              active: true,
            }),
          ]);

          // Combine and remove duplicates
          const allTemplates = [...(scopedData.data || []), ...(globalData.data || [])];
          const uniqueTemplates = allTemplates.filter(
            (template, index, self) => index === self.findIndex((t) => t.id === template.id)
          );
          setTemplates(uniqueTemplates);
        } else {
          const data = await getTemplates({
            page: 1,
            pageSize: 50,
            scope: scope,
            active: true,
          });
          setTemplates(data.data || []);
        }
      } catch (e) {
        console.error('Error fetching templates:', e);
      } finally {
        setLoading(false);
      }
    };

    fetchTemplates();
  }, [scope]);

  if (loading) {
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
