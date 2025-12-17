'use client';

import type {
  Announcements,
  DndContextProps,
  DragEndEvent,
  DragOverEvent,
  DragStartEvent,
} from '@dnd-kit/core';
import {
  closestCenter,
  DndContext,
  DragOverlay,
  KeyboardSensor,
  MouseSensor,
  TouchSensor,
  useDroppable,
  useSensor,
  useSensors,
} from '@dnd-kit/core';
import { arrayMove, SortableContext, useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { GripVertical } from 'lucide-react';
import {
  createContext,
  type HTMLAttributes,
  type ReactNode,
  useContext,
  useEffect,
  useRef,
  useState,
} from 'react';
import { createPortal } from 'react-dom';
import tunnel from 'tunnel-rat';

import { Card } from '@/components/ui/card';
import { ScrollArea, ScrollBar } from '@/components/ui/scroll-area';
import { useConditionalVirtualizer } from '@/hooks/use-conditional-virtualizer';
import { cn } from '@/lib/utils';

const t = tunnel();

export type { DragEndEvent } from '@dnd-kit/core';

type KanbanItemProps = {
  id: string;
  name: string;
  column: string;
} & Record<string, unknown>;

type KanbanColumnProps = {
  id: string;
  name: string;
} & Record<string, unknown>;

type KanbanContextProps<
  T extends KanbanItemProps = KanbanItemProps,
  C extends KanbanColumnProps = KanbanColumnProps,
> = {
  columns: C[];
  data: T[];
  activeCardId: string | null;
  isReorderMode?: boolean;
};

const KanbanContext = createContext<KanbanContextProps>({
  columns: [],
  data: [],
  activeCardId: null,
  isReorderMode: false,
});

export type KanbanBoardProps = {
  id: string;
  children: ReactNode;
  className?: string;
};

export const KanbanBoard = ({ id, children, className }: KanbanBoardProps) => {
  const { isReorderMode } = useContext(KanbanContext);

  const { isOver, setNodeRef: setDroppableRef } = useDroppable({
    id,
  });

  const { attributes, listeners, setNodeRef, transition, transform, isDragging } = useSortable({
    id,
    disabled: !isReorderMode, // Only enable sorting in reorder mode
  });

  const style = {
    transition,
    transform: CSS.Transform.toString(transform),
  };

  const combinedRef = (node: HTMLDivElement | null) => {
    setNodeRef(node);
    setDroppableRef(node);
  };

  return (
    <div
      ref={combinedRef}
      style={style}
      {...attributes}
      {...(isReorderMode ? listeners : {})} // Only apply listeners in reorder mode
      className={cn(
        'relative flex w-full max-h-[80vh] min-h-40 min-w-[230px] flex-col divide-y overflow-hidden rounded-md border bg-secondary/60 text-xs shadow-sm ring-2 transition-all',
        isOver ? 'ring-primary' : 'ring-transparent',
        isDragging && 'opacity-50',
        isReorderMode && 'cursor-grab active:cursor-grabbing',
        className
      )}
    >
      {children}
      <div className="pointer-events-none absolute bottom-0 left-0 right-0 h-10 bg-gradient-to-t from-secondary to-transparent backdrop-blur-md [mask-image:linear-gradient(to_top,black,transparent)] z-10" />
    </div>
  );
};

export type KanbanCardProps<T extends KanbanItemProps = KanbanItemProps> = T & {
  children?: ReactNode;
  className?: string;
  onClick?: () => void;
  disabledGrabbing?: boolean;
};

export const KanbanCard = <T extends KanbanItemProps = KanbanItemProps>({
  id,
  name,
  children,
  className,
  onClick,
  disabledGrabbing,
}: KanbanCardProps<T>) => {
  const { activeCardId, isReorderMode } = useContext(KanbanContext) as KanbanContextProps;

  const { attributes, listeners, setNodeRef, transition, transform, isDragging } = useSortable({
    id,
    disabled: isReorderMode, // Disable card dragging in reorder mode
  });

  const style = {
    transition,
    transform: CSS.Transform.toString(transform),
  };

  return (
    <>
      <div style={style} {...attributes} ref={setNodeRef} className="w-full min-w-0">
        <Card
          className={cn(
            'gap-4 rounded-md shadow-sm w-full min-w-0',
            isDragging && 'opacity-30',
            className
          )}
        >
          <div className="flex items-start gap-2 p-2 relative min-w-0">
            <div
              onClick={isReorderMode ? undefined : onClick}
              className={cn('flex-1 min-w-0', !isReorderMode && 'cursor-pointer')}
            >
              {children ?? <p className="m-0 font-medium text-sm">{name}</p>}
            </div>

            {!isReorderMode && !disabledGrabbing && (
              <div
                {...listeners}
                className="cursor-grab active:cursor-grabbing text-muted-foreground hover:text-foreground transition-colors absolute right-2 top-2 shrink-0 bg-background/50 rounded-full p-0.5"
              >
                <GripVertical className="h-4 w-4" />
              </div>
            )}
          </div>
        </Card>
      </div>
      {activeCardId === id && (
        <t.In>
          <Card
            className={cn(
              'gap-4 rounded-md shadow-sm ring-2 ring-primary w-full min-w-0',
              className
            )}
          >
            <div className="flex items-start gap-2 p-2 relative min-w-0">
              <div className="flex-1 min-w-0">
                {children ?? <p className="m-0 font-medium text-sm">{name}</p>}
              </div>
              <div className="cursor-grabbing text-muted-foreground absolute right-2 top-2 shrink-0">
                <GripVertical className="h-4 w-4" />
              </div>
            </div>
          </Card>
        </t.In>
      )}
    </>
  );
};

export type KanbanCardsProps<T extends KanbanItemProps = KanbanItemProps> = Omit<
  HTMLAttributes<HTMLDivElement>,
  'children' | 'id'
> & {
  children: (item: T) => ReactNode;
  id: string;
};

export const KanbanCards = <T extends KanbanItemProps = KanbanItemProps>({
  children,
  className,
  ...props
}: KanbanCardsProps<T>) => {
  const { data } = useContext(KanbanContext) as KanbanContextProps<T>;
  const filteredData = data.filter((item) => item.column === props.id);
  const items = filteredData.map((item) => item.id);

  const scrollRef = useRef<HTMLDivElement>(null);
  const scrollAreaRef = useRef<HTMLDivElement>(null);
  const viewportRef = useRef<HTMLElement | null>(null);

  // Get the actual scrolling viewport element from ScrollArea
  useEffect(() => {
    if (scrollAreaRef.current) {
      const viewport = scrollAreaRef.current.querySelector(
        '[data-radix-scroll-area-viewport]'
      ) as HTMLElement;
      viewportRef.current = viewport;
    }
  }, []);

  // Create a stable key that changes when items change to force virtualizer reset
  const itemsKey =
    items.length > 0 ? `${items.length}-${items[0]}-${items[items.length - 1]}` : 'empty';

  const virtualizer = useConditionalVirtualizer({
    count: filteredData.length,
    parentRef: viewportRef,
    estimateSize: () => 200,
    overscan: 5,
  });

  // Force virtualizer to recalculate when items change
  useEffect(() => {
    if (virtualizer) {
      virtualizer.measure();
    }
  }, [itemsKey, virtualizer]);

  return (
    <ScrollArea
      ref={scrollAreaRef}
      className="flex-1 w-full min-h-0 overflow-hidden [&>[data-radix-scroll-area-viewport]>div]:!block"
      style={{ maxHeight: 'calc(80vh - 50px)' }}
    >
      <SortableContext items={items}>
        <div
          ref={scrollRef}
          className={cn('flex flex-grow flex-col', virtualizer ? '' : 'gap-2', 'p-2', className)}
          {...props}
        >
          {virtualizer ? (
            <div
              key={itemsKey}
              style={{
                height: `${virtualizer.getTotalSize()}px`,
                width: '100%',
                position: 'relative',
              }}
            >
              {virtualizer.getVirtualItems().map((virtualItem) => {
                const item = filteredData[virtualItem.index];
                if (!item) return null;

                const isLastItem = virtualItem.index === filteredData.length - 1;

                return (
                  <div
                    key={item.id}
                    data-index={virtualItem.index}
                    ref={virtualizer.measureElement}
                    style={{
                      position: 'absolute',
                      top: 0,
                      left: 0,
                      width: '100%',
                      transform: `translateY(${virtualItem.start}px)`,
                      paddingBottom: isLastItem ? '12px' : `8px`,
                    }}
                  >
                    {children(item)}
                  </div>
                );
              })}
            </div>
          ) : (
            filteredData.map((item, idx, arr) => (
              <div key={item.id} className={cn(idx === arr.length - 1 && 'pb-3')}>
                {children(item)}
              </div>
            ))
          )}
        </div>
      </SortableContext>
      <ScrollBar orientation="vertical" />
    </ScrollArea>
  );
};

export type KanbanHeaderProps = HTMLAttributes<HTMLDivElement>;

export const KanbanHeader = ({ className, ...props }: KanbanHeaderProps) => (
  <div className={cn('m-0 p-2 font-semibold text-sm', className)} {...props} />
);

export type KanbanProviderProps<
  T extends KanbanItemProps = KanbanItemProps,
  C extends KanbanColumnProps = KanbanColumnProps,
> = Omit<DndContextProps, 'children'> & {
  children: (column: C) => ReactNode;
  className?: string;
  columns: C[];
  data: T[];
  onDataChange?: (data: T[]) => void;
  onColumnsChange?: (columns: C[]) => void;
  onDragStart?: (event: DragStartEvent) => void;
  onDragEnd?: (event: DragEndEvent) => void;
  onDragOver?: (event: DragOverEvent) => void;
  isReorderMode?: boolean;
};

export const KanbanProvider = <
  T extends KanbanItemProps = KanbanItemProps,
  C extends KanbanColumnProps = KanbanColumnProps,
>({
  children,
  onDragStart,
  onDragEnd,
  onDragOver,
  className,
  columns,
  data,
  onDataChange,
  onColumnsChange,
  isReorderMode = false,
  ...props
}: KanbanProviderProps<T, C>) => {
  const [activeCardId, setActiveCardId] = useState<string | null>(null);
  const [_activeColumnId, setActiveColumnId] = useState<string | null>(null);

  const sensors = useSensors(
    useSensor(MouseSensor),
    useSensor(TouchSensor),
    useSensor(KeyboardSensor)
  );

  const handleDragStart = (event: DragStartEvent) => {
    // Disable card dragging in reorder mode
    if (isReorderMode) {
      const column = columns.find((col) => col.id === event.active.id);
      if (column) {
        setActiveColumnId(event.active.id as string);
      }
      onDragStart?.(event);
      return;
    }

    const card = data.find((item) => item.id === event.active.id);
    const column = columns.find((col) => col.id === event.active.id);

    if (card) {
      setActiveCardId(event.active.id as string);
    } else if (column) {
      setActiveColumnId(event.active.id as string);
    }

    onDragStart?.(event);
  };

  const handleDragOver = (event: DragOverEvent) => {
    const { active, over } = event;

    if (!over) {
      return;
    }

    const activeItem = data.find((item) => item.id === active.id);

    if (!activeItem) {
      return;
    }

    onDragOver?.(event);
  };

  const handleDragEnd = (event: DragEndEvent) => {
    setActiveCardId(null);
    setActiveColumnId(null);

    onDragEnd?.(event);

    const { active, over } = event;

    if (!over) {
      return;
    }

    // Check if we're dragging a column
    const activeColumn = columns.find((col) => col.id === active.id);
    const overColumn = columns.find((col) => col.id === over.id);

    if (activeColumn && overColumn && active.id !== over.id) {
      // Column reordering
      const oldIndex = columns.findIndex((col) => col.id === active.id);
      const newIndex = columns.findIndex((col) => col.id === over.id);
      const newColumns = arrayMove(columns, oldIndex, newIndex);
      onColumnsChange?.(newColumns);
      return;
    }

    // Card dragging logic
    let newData = [...data];

    const activeItem = newData.find((item) => item.id === active.id);
    const overItem = newData.find((item) => item.id === over.id);

    if (!activeItem) {
      return;
    }

    const activeCardColumn = activeItem.column;
    const overCardColumn =
      overItem?.column || columns.find((col) => col.id === over.id)?.id || columns[0]?.id;

    if (activeCardColumn !== overCardColumn) {
      const activeIndex = newData.findIndex((item) => item.id === active.id);
      newData[activeIndex] = { ...newData[activeIndex], column: overCardColumn };
    }

    if (active.id !== over.id) {
      const oldIndex = newData.findIndex((item) => item.id === active.id);
      const newIndex = newData.findIndex((item) => item.id === over.id);
      newData = arrayMove(newData, oldIndex, newIndex);
    }

    onDataChange?.(newData);
  };

  const announcements: Announcements = {
    onDragStart({ active }) {
      const { name, column } = data.find((item) => item.id === active.id) ?? {};

      return `Picked up the card "${name}" from the "${column}" column`;
    },
    onDragOver({ active, over }) {
      const { name } = data.find((item) => item.id === active.id) ?? {};
      const newColumn = columns.find((column) => column.id === over?.id)?.name;

      return `Dragged the card "${name}" over the "${newColumn}" column`;
    },
    onDragEnd({ active, over }) {
      const { name } = data.find((item) => item.id === active.id) ?? {};
      const newColumn = columns.find((column) => column.id === over?.id)?.name;

      return `Dropped the card "${name}" into the "${newColumn}" column`;
    },
    onDragCancel({ active }) {
      const { name } = data.find((item) => item.id === active.id) ?? {};

      return `Cancelled dragging the card "${name}"`;
    },
  };

  return (
    <KanbanContext.Provider value={{ columns, data, activeCardId, isReorderMode }}>
      <DndContext
        accessibility={{ announcements }}
        collisionDetection={closestCenter}
        onDragEnd={handleDragEnd}
        onDragOver={handleDragOver}
        onDragStart={handleDragStart}
        sensors={sensors}
        {...props}
      >
        <SortableContext items={columns.map((col) => col.id)}>
          <div className={cn('flex flex-col md:flex-row h-full gap-3', className)}>
            {columns.map((column) => children(column))}
          </div>
        </SortableContext>
        {typeof window !== 'undefined' &&
          createPortal(
            <DragOverlay>
              <t.Out />
            </DragOverlay>,
            document.body
          )}
      </DndContext>
    </KanbanContext.Provider>
  );
};
