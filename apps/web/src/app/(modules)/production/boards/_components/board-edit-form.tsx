'use client';

import {
  closestCenter,
  DndContext,
  type DragEndEvent,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
} from '@dnd-kit/core';
import {
  arrayMove,
  horizontalListSortingStrategy,
  SortableContext,
  useSortable,
} from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { zodResolver } from '@hookform/resolvers/zod';
import type { BoardSummary, ColumnOperation } from '@magic-system/schemas';
import { ChevronLeft, ChevronRight, GripVertical, Plus, X } from 'lucide-react';
import { useEffect, useRef, useState } from 'react';
import { useForm } from 'react-hook-form';
import { toast } from 'sonner';
import { z } from 'zod';

import { useUpdateBoard } from '@/app/http/hooks/use-boards';
import { DialogAction } from '@/components/dialog-action';
import { Button } from '@/components/ui/button';
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { useDisclosure } from '@/hooks/use-disclosure';

// Edit form schema
const editBoardFormSchema = z.object({
  title: z.string().min(1, 'O título é obrigatório'),
  description: z.string().optional().nullable(),
});

type FormData = z.infer<typeof editBoardFormSchema>;

interface ColumnState {
  id?: string;
  title: string;
  order: number;
  isNew?: boolean;
  isDeleted?: boolean;
  originalTitle?: string;
  originalOrder?: number;
}

// Sortable column component
function SortableColumn({
  column,
  index,
  columns,
  onTitleChange,
  onRemove,
  onDeleteRequest,
}: {
  column: ColumnState;
  index: number;
  columns: ColumnState[];
  onTitleChange: (index: number, title: string) => void;
  onRemove: (column: ColumnState) => void;
  onDeleteRequest: (column: ColumnState) => void;
}) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({
    id: column.id || `new-${index}`,
  });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
  };

  return (
    <div
      ref={setNodeRef}
      style={style}
      className={`relative flex flex-col border rounded-t-lg p-3 pb-0 w-[200px] h-[120px] bg-muted/30 flex-shrink-0 overflow-hidden ${
        isDragging ? 'opacity-50 z-50' : ''
      }`}
    >
      <div className="flex items-center justify-between mb-2">
        <button
          type="button"
          className="cursor-grab active:cursor-grabbing touch-none"
          {...attributes}
          {...listeners}
        >
          <GripVertical className="h-4 w-4 text-muted-foreground" />
        </button>
        <Button
          type="button"
          variant="ghost"
          size="icon"
          className="h-6 w-6"
          onClick={() => {
            if (column.isNew) {
              onRemove(column);
            } else {
              onDeleteRequest(column);
            }
          }}
        >
          <X className="h-3.5 w-3.5" />
        </Button>
      </div>
      <Input
        value={column.title}
        onChange={(e) =>
          onTitleChange(
            columns.findIndex((c) => c === column),
            e.target.value
          )
        }
        placeholder="Nome da coluna"
        className="h-8 text-sm"
      />
      <div className="absolute bottom-0 z-10 left-0 right-0 h-12 bg-gradient-to-t from-border/100 to-transparent pointer-events-none" />
    </div>
  );
}

interface BoardEditFormProps {
  board: BoardSummary;
  onBack: () => void;
  onSuccess: () => void;
}

export function BoardEditForm({ board, onBack, onSuccess }: BoardEditFormProps) {
  const [columns, setColumns] = useState<ColumnState[]>([]);
  const updateBoardMutation = useUpdateBoard();
  const deleteColumnDisclosure = useDisclosure();
  const scrollContainerRef = useRef<HTMLDivElement>(null);
  const [showLeftScroll, setShowLeftScroll] = useState(false);
  const [showRightScroll, setShowRightScroll] = useState(false);

  // Form for editing
  const form = useForm<FormData>({
    resolver: zodResolver(editBoardFormSchema),
    defaultValues: {
      title: board.title,
      description: board.description || '',
    },
  });

  const checkScroll = () => {
    if (scrollContainerRef.current) {
      const { scrollLeft, scrollWidth, clientWidth } = scrollContainerRef.current;
      const hasScroll = scrollWidth > clientWidth;

      // Check if we are close to the end (e.g. within 10px)
      const isAtEnd = Math.abs(scrollWidth - clientWidth - scrollLeft) < 10;
      const isAtStart = scrollLeft < 10;

      setShowRightScroll(hasScroll && !isAtEnd);
      setShowLeftScroll(hasScroll && !isAtStart);
    }
  };

  useEffect(() => {
    checkScroll();
    window.addEventListener('resize', checkScroll);
    return () => window.removeEventListener('resize', checkScroll);
  }, [columns]);

  const scrollRight = () => {
    if (scrollContainerRef.current) {
      scrollContainerRef.current.scrollBy({ left: 300, behavior: 'smooth' });
    }
  };

  const scrollLeft = () => {
    if (scrollContainerRef.current) {
      scrollContainerRef.current.scrollBy({ left: -300, behavior: 'smooth' });
    }
  };

  // Initialize columns
  useEffect(() => {
    setColumns(
      board.columns.map((col) => ({
        id: col.id,
        title: col.title,
        order: col.order,
        originalTitle: col.title,
        originalOrder: col.order,
      }))
    );
  }, [board]);

  // Column management
  const handleAddColumn = () => {
    const maxOrder = Math.max(...columns.map((c) => c.order), -1);
    setColumns([
      ...columns,
      {
        title: '',
        order: maxOrder + 1,
        isNew: true,
      },
    ]);
  };

  const handleRemoveColumn = (column: ColumnState) => {
    if (column.isNew) {
      setColumns(columns.filter((c) => c !== column));
    } else {
      setColumns(columns.map((c) => (c === column ? { ...c, isDeleted: true } : c)));
    }
    deleteColumnDisclosure.close();
  };

  const handleColumnTitleChange = (index: number, title: string) => {
    const newColumns = [...columns];
    newColumns[index] = { ...newColumns[index], title };
    setColumns(newColumns);
  };

  // Drag and drop sensors
  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 8,
      },
    }),
    useSensor(KeyboardSensor)
  );

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;

    if (over && active.id !== over.id) {
      setColumns((items) => {
        const oldIndex = items.findIndex(
          (item) => (item.id || `new-${items.indexOf(item)}`) === active.id
        );
        const newIndex = items.findIndex(
          (item) => (item.id || `new-${items.indexOf(item)}`) === over.id
        );

        const reordered = arrayMove(items, oldIndex, newIndex);
        // Update order values
        return reordered.map((item, idx) => ({ ...item, order: idx }));
      });
    }
  };

  const onSubmit = async (data: FormData) => {
    try {
      const columnOperations: ColumnOperation[] = [];

      // Check if any existing columns have changed order
      const existingColumns = columns.filter((c) => c.id && !c.isDeleted && !c.isNew);
      const hasOrderChanged = existingColumns.some((col) => col.order !== col.originalOrder);

      if (hasOrderChanged) {
        columnOperations.push({
          action: 'reorder',
          columnOrders: existingColumns.map((col) => ({
            id: col.id!,
            order: col.order,
          })),
        });
      }

      for (const column of columns) {
        if (column.isDeleted && column.id) {
          columnOperations.push({
            action: 'delete',
            id: column.id,
          });
        } else if (column.isNew && column.title.trim()) {
          columnOperations.push({
            action: 'add',
            title: column.title.trim(),
          });
        } else if (column.id && column.title !== column.originalTitle && column.title.trim()) {
          columnOperations.push({
            action: 'rename',
            id: column.id,
            title: column.title.trim(),
          });
        }
      }

      await updateBoardMutation.mutateAsync({
        id: board.id,
        data: {
          title: data.title,
          description: data.description || null,
          columnOperations: columnOperations.length > 0 ? columnOperations : undefined,
        },
      });

      toast.success('Quadro atualizado com sucesso');
      onSuccess();
    } catch (error: any) {
      console.error(error);
      const message = error?.message || 'Erro ao atualizar quadro';
      toast.error(message);
    }
  };

  const activeColumns = columns.filter((c) => !c.isDeleted);

  return (
    <div className="flex flex-col min-w-0">
      <div className="w-full px-2">
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-5">
            <FormField
              control={form.control}
              name="title"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Nome do quadro</FormLabel>
                  <FormControl>
                    <Input placeholder="Ex: Development Sprint" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="description"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Descrição</FormLabel>
                  <FormControl>
                    <Textarea
                      placeholder="Ex: Tracking tasks for current sprint"
                      className="resize-none"
                      rows={3}
                      {...field}
                      value={field.value || ''}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <div className="space-y-3 min-w-0">
              <Label>Colunas</Label>

              <div className="relative group">
                <div
                  ref={scrollContainerRef}
                  onScroll={checkScroll}
                  className="overflow-x-auto -mx-6 px-6 [&::-webkit-scrollbar]:hidden no-scrollbar"
                >
                  <DndContext
                    sensors={sensors}
                    collisionDetection={closestCenter}
                    onDragEnd={handleDragEnd}
                  >
                    <SortableContext
                      items={activeColumns.map((col, idx) => col.id || `new-${idx}`)}
                      strategy={horizontalListSortingStrategy}
                    >
                      <div className="flex gap-3 w-max">
                        {activeColumns.map((column, index) => (
                          <SortableColumn
                            key={column.id || `new-${index}`}
                            column={column}
                            index={index}
                            columns={columns}
                            onTitleChange={handleColumnTitleChange}
                            onRemove={handleRemoveColumn}
                            onDeleteRequest={(col) => deleteColumnDisclosure.open({ state: col })}
                          />
                        ))}

                        {/* Add column card */}
                        <div
                          onClick={handleAddColumn}
                          className="flex flex-col items-center justify-center border border-dashed rounded-lg p-3 w-[160px] min-h-[88px] cursor-pointer transition-colors hover:border-primary hover:bg-muted/50 flex-shrink-0"
                        >
                          <Plus className="h-5 w-5 text-muted-foreground mb-1" />
                          <span className="text-sm text-muted-foreground">Nova coluna</span>
                        </div>
                      </div>
                    </SortableContext>
                  </DndContext>
                </div>

                {showLeftScroll && (
                  <Button
                    type="button"
                    size="icon"
                    variant="secondary"
                    className="absolute left-0 top-1/2 -translate-y-1/2 z-10 shadow-md rounded-full h-8 w-8 opacity-0 group-hover:opacity-100 transition-opacity"
                    onClick={scrollLeft}
                  >
                    <ChevronLeft className="h-4 w-4" />
                  </Button>
                )}

                {showRightScroll && (
                  <Button
                    type="button"
                    size="icon"
                    variant="secondary"
                    className="absolute right-0 top-1/2 -translate-y-1/2 z-10 shadow-md rounded-full h-8 w-8 opacity-0 group-hover:opacity-100 transition-opacity"
                    onClick={scrollRight}
                  >
                    <ChevronRight className="h-4 w-4" />
                  </Button>
                )}
              </div>
            </div>

            <div className="flex gap-2 justify-end pt-4 mt-0">
              <Button type="button" variant="outline" onClick={onBack}>
                Cancelar
              </Button>
              <Button type="submit" disabled={updateBoardMutation.isPending}>
                {updateBoardMutation.isPending ? 'Salvando...' : 'Salvar Alterações'}
              </Button>
            </div>
          </form>
        </Form>
      </div>

      {/* Delete Column Confirmation */}
      <DialogAction
        open={deleteColumnDisclosure.isOpen}
        title="Remover coluna"
        subtitle={`Tem certeza que deseja remover a coluna "${deleteColumnDisclosure.state?.title}"? Colunas com cartões não podem ser removidas.`}
        onRefuse={() => deleteColumnDisclosure.close()}
        confirmButton={
          <Button
            variant="destructive"
            onClick={() => {
              if (deleteColumnDisclosure.state) {
                handleRemoveColumn(deleteColumnDisclosure.state);
              }
            }}
          >
            Remover
          </Button>
        }
      />
    </div>
  );
}
