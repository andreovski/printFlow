import { CardAttachment, Tag } from '@magic-system/schemas';
import {
  AlertCircle,
  ArrowDown,
  ArrowRight,
  ArrowUp,
  Calendar,
  CheckSquare,
  Link,
  Paperclip,
} from 'lucide-react';
import Image from 'next/image';
import { useMemo } from 'react';

import { Card as ApiCard } from '@/app/http/requests/boards';
import { KanbanCard } from '@/components/ui/shadcn-io/kanban';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { stripHtml } from '@/lib/utils';

import { EditCardDialog } from '../edit/edit-card-dialog';

function isImageMimeType(mimeType: string | null): boolean {
  if (!mimeType) return false;
  return mimeType.startsWith('image/');
}

function getCoverImage(attachments?: CardAttachment[]): CardAttachment | null {
  if (!attachments || attachments.length === 0) return null;
  // Retorna a primeira imagem encontrada como capa
  return attachments.find((att) => isImageMimeType(att.mimeType)) || null;
}

interface ProductionKanbanCardProps {
  item: ApiCard & { name: string; column: string };
  onCardUpdated: (updatedCard: ApiCard) => void;
  onCardDeleted: (cardId: string) => void;
}

const priorityConfig: Record<string, { label: string; icon: React.ElementType; color: string }> = {
  LOW: { label: 'Baixo', icon: ArrowDown, color: 'text-slate-500' },
  MEDIUM: { label: 'Médio', icon: ArrowRight, color: 'text-blue-500' },
  HIGH: { label: 'Alto', icon: ArrowUp, color: 'text-orange-500' },
  URGENT: { label: 'Urgente', icon: AlertCircle, color: 'text-red-500' },
};

function formatDueDate(dueDate: string): string {
  const date = new Date(dueDate);
  const today = new Date();
  const tomorrow = new Date(today);
  tomorrow.setDate(tomorrow.getDate() + 1);

  const isToday = date.toDateString() === today.toDateString();
  const isTomorrow = date.toDateString() === tomorrow.toDateString();

  if (isToday) return 'Hoje';
  if (isTomorrow) return 'Amanhã';

  return date.toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit' });
}

function getDueDateColor(dueDate: string): string {
  const date = new Date(dueDate);
  const today = new Date();
  const diffInMs = date.getTime() - today.getTime();
  const diffInDays = diffInMs / (1000 * 60 * 60 * 24);

  if (diffInDays < 0) return 'text-red-500'; // Vencido
  if (diffInDays <= 2) return 'text-orange-500'; // Vence em até 2 dias
  return 'text-green-600'; // Vence em mais de 2 dias
}

export function ProductionKanbanCard({
  item,
  onCardUpdated,
  onCardDeleted,
}: ProductionKanbanCardProps) {
  const priorityInfo = item.priority ? priorityConfig[item.priority] : null;
  const plainDescription = item.description ? stripHtml(String(item.description)) : null;

  // Encontrar a primeira imagem para usar como capa
  const coverImage = useMemo(() => getCoverImage(item.attachments), [item.attachments]);
  const attachmentCount = item.attachments?.length ?? 0;

  // Calcular progresso do checklist
  const checklistTotal = item.checklistItems?.length ?? 0;
  const checklistCompleted = item.checklistItems?.filter((i) => i.isCompleted).length ?? 0;
  const isChecklistComplete = checklistTotal > 0 && checklistCompleted === checklistTotal;

  return (
    <KanbanCard id={item.id} name={item.name} column={item.column} className="w-full max-w-full">
      <EditCardDialog card={item} onCardUpdated={onCardUpdated} onCardDeleted={onCardDeleted}>
        <div className="flex flex-col gap-1 group/card min-w-0 w-full">
          {/* Imagem de capa do card - estilo Trello */}
          {coverImage && (
            <div className="-mx-2 -mt-2 mb-1 relative aspect-video overflow-hidden rounded-t-md">
              <Image
                src={coverImage.url}
                alt={coverImage.name}
                fill
                className="object-cover"
                sizes="(max-width: 300px) 100vw, 280px"
              />
            </div>
          )}

          <span className="font-medium break-words">{item.name}</span>
          {plainDescription && (
            <span className="text-xs text-muted-foreground line-clamp-2 break-words">
              {plainDescription}
            </span>
          )}

          {item.tags && item.tags.length > 0 && (
            <div className="flex flex-wrap gap-1.5 mt-1">
              {(item.tags as Tag[]).map((tag) => (
                <div
                  key={tag.id}
                  className="flex items-center h-2.5 w-2.5 group-hover/card:w-auto group-hover/card:h-5 transition-all duration-300 ease-in-out rounded-full group-hover/card:rounded-full group-hover/card:px-2 overflow-hidden shrink-0"
                  style={{ backgroundColor: tag.color }}
                  title={tag.name}
                >
                  <span className="hidden group-hover/card:block text-[10px] font-medium text-white whitespace-nowrap transition-all duration-200 delay-100">
                    {tag.name}
                  </span>
                </div>
              ))}
            </div>
          )}

          <div className="flex flex-wrap items-center gap-2 mt-1">
            {item.budget && (
              <TooltipProvider>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <div className="flex items-center gap-1 text-xs text-primary bg-primary/10 px-1 py-0.5 rounded shrink-0">
                      <Link className="h-3 w-3 shrink-0" />
                      <span>#{item.budget.code}</span>
                    </div>
                  </TooltipTrigger>
                  <TooltipContent side="top">
                    <div className="text-xs">
                      <p className="font-medium">Orçamento vinculado</p>
                      <p>{item.budget.client.name}</p>
                      <p>
                        {new Intl.NumberFormat('pt-BR', {
                          style: 'currency',
                          currency: 'BRL',
                        }).format(item.budget.total)}
                      </p>
                    </div>
                  </TooltipContent>
                </Tooltip>
              </TooltipProvider>
            )}

            {priorityInfo && (
              <div className={`flex items-center gap-1 text-xs ${priorityInfo.color} shrink-0`}>
                <priorityInfo.icon className="h-3 w-3 shrink-0" />
                <span>{priorityInfo.label}</span>
              </div>
            )}

            {item.dueDate && (
              <div
                className={`flex items-center gap-1 text-xs ${getDueDateColor(item.dueDate)} shrink-0`}
              >
                <Calendar className="h-3 w-3 shrink-0" />
                <span>{formatDueDate(item.dueDate)}</span>
              </div>
            )}

            {checklistTotal > 0 && (
              <div
                className={`flex items-center gap-1 text-xs shrink-0 ${
                  isChecklistComplete
                    ? 'text-green-600 bg-green-100 dark:bg-green-900/30'
                    : 'text-muted-foreground'
                } px-1 py-0.5 rounded`}
              >
                <CheckSquare className="h-3 w-3 shrink-0" />
                <span>
                  {checklistCompleted}/{checklistTotal}
                </span>
              </div>
            )}

            {attachmentCount > 0 && (
              <div className="flex items-center gap-1 text-xs text-muted-foreground shrink-0">
                <Paperclip className="h-3 w-3 shrink-0" />
                <span>{attachmentCount}</span>
              </div>
            )}
          </div>
        </div>
      </EditCardDialog>
    </KanbanCard>
  );
}
