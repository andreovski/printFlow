'use client';

import { ChevronDown, ChevronUp, Bell, AlertTriangle, CheckCircle, Info, X } from 'lucide-react';
import { useState } from 'react';

import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { cn } from '@/lib/utils';

export interface Notification {
  id: string;
  title: string;
  description: string;
  type: 'info' | 'warning' | 'success' | 'error';
  date: string;
  read: boolean;
  route?: string;
}

const initialNotifications: Notification[] = [
  {
    id: '1',
    title: 'Financeiro / Vendas',
    description: 'Você tem 2 contas a vencer no dia de hoje!',
    type: 'warning',
    date: 'Hoje',
    read: false,
  },
  {
    id: '2',
    title: 'Financeiro / Orçamento',
    description: 'Você tem 2 orçamentos a vencer hoje!',
    type: 'info',
    date: 'Ontem',
    read: false,
  },
  {
    id: '3',
    title: 'Produção / Quadros',
    description: 'Você tem 4 quadros com a data limite de hoje!',
    type: 'error',
    date: 'Hoje',
    read: true,
  },
  {
    id: '4',
    title: 'Financeiro / Vendas',
    description: 'O orçamento #333 foi recusado pelo cliente.',
    type: 'error',
    date: 'Hoje',
    read: false,
  },
  {
    id: '5',
    title: 'Sistema',
    description: 'Backup realizado com sucesso.',
    type: 'success',
    date: 'Ontem',
    read: true,
  },
  {
    id: '6',
    title: 'Financeiro / Vendas',
    description: 'Nova proposta aprovada!',
    type: 'success',
    date: 'Ontem',
    read: false,
  },
];

const getNotificationIcon = (type: Notification['type']) => {
  switch (type) {
    case 'warning':
      return <AlertTriangle className="h-4 w-4 text-amber-500" />;
    case 'error':
      return <Bell className="h-4 w-4 text-red-500" />;
    case 'success':
      return <CheckCircle className="h-4 w-4 text-green-500" />;
    case 'info':
    default:
      return <Info className="h-4 w-4 text-blue-500" />;
  }
};

interface GlobalSearchNotificationsProps {
  expanded: boolean;
  onToggle: () => void;
}

export function GlobalSearchNotifications({
  expanded,
  onToggle,
}: Readonly<GlobalSearchNotificationsProps>) {
  const [notifications, setNotifications] = useState<Notification[]>(initialNotifications);

  const handleDelete = (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    setNotifications((prev) => prev.filter((n) => n.id !== id));
  };

  // We'll show the top 3 notifications in collapsed state
  const topNotifications = notifications.slice(0, 3);
  const remainingCount = Math.max(0, notifications.length - 3);

  return (
    <div
      className={cn(
        'relative flex w-full flex-col transition-all duration-300 ease-in-out',
        expanded ? 'h-[400px]' : 'h-10 mt-4'
      )}
    >
      {/* Header / Toggle Area */}
      <div
        className={cn(
          'flex items-center justify-center w-full cursor-pointer py-2 transition-all duration-300',
          expanded ? 'mb-2' : ''
        )}
        onClick={onToggle}
      >
        <div className="flex items-center gap-2 text-sm font-medium text-background dark:text-muted-foreground hover:text-muted-foreground dark:hover:text-muted transition-colors">
          {expanded ? <ChevronDown className="h-4 w-4" /> : <ChevronUp className="h-4 w-4" />}
          <span>Notificações</span>
        </div>
      </div>

      {/* Expanded Content */}
      <div
        className={cn(
          'flex-1 w-full transition-all duration-300 ease-in-out overflow-hidden relative',
          expanded ? 'opacity-100 visible' : 'opacity-0 invisible h-0'
        )}
      >
        <ScrollArea className="h-full w-full pr-4">
          <div className="flex flex-col gap-2 p-2">
            {notifications.map((notification) => (
              <div
                key={notification.id}
                className="group relative flex flex-col gap-1 rounded-lg border bg-background p-3 hover:bg-background/80 transition-all"
              >
                <button
                  onClick={(e) => handleDelete(notification.id, e)}
                  className="absolute -right-2 -top-2 rounded-full p-1 opacity-0 group-hover:opacity-100 bg-background hover:bg-red-600 transition-all"
                >
                  <X className="h-4 w-4 text-muted-foreground hover:text-white" />
                </button>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    {getNotificationIcon(notification.type)}
                    <span className="text-xs font-semibold text-muted-foreground">
                      {notification.title}
                    </span>
                  </div>
                  <span className="text-[10px] text-muted-foreground">{notification.date}</span>
                </div>
                <p className="text-sm font-medium pl-6">{notification.description}</p>
              </div>
            ))}
          </div>
        </ScrollArea>
      </div>

      {/* Collapsed Content (Stacked Cards) */}
      <div
        className={cn(
          'relative flex flex-col items-center w-full transition-all duration-300 ease-in-out',
          expanded ? 'opacity-0 invisible h-0 overflow-hidden' : 'opacity-100 visible'
        )}
      >
        <div
          className="relative w-[90%] flex flex-col items-center cursor-pointer"
          onClick={onToggle}
        >
          {topNotifications.map((notification, index) => {
            // Calculate scale and opacity based on index (0 is top)
            const scale = 1 - index * 0.05;
            const opacity = 1 - index * 0.2;
            const translateY = index * 8; // Stack distance
            const zIndex = 10 - index;

            return (
              <div
                key={notification.id}
                className="absolute top-0 left-0 right-0 w-full rounded-lg border bg-background shadow-sm p-3 transition-all duration-300 origin-top"
                style={{
                  transform: `translateY(${translateY}px) scale(${scale})`,
                  opacity: opacity,
                  zIndex: zIndex,
                  position: index === 0 ? 'relative' : 'absolute', // First one takes space
                }}
              >
                <div className="flex items-center justify-between mb-1">
                  <div className="flex items-center gap-2">
                    {/* Only show icon for the top card to avoid clutter, or maybe all? Let's show for all in stack */}
                    {getNotificationIcon(notification.type)}
                    <span className="text-xs font-bold">{notification.title}</span>
                  </div>
                  <span className="text-[10px] text-muted-foreground">{notification.date}</span>
                </div>
                <p className="text-sm line-clamp-1 pl-6">{notification.description}</p>
              </div>
            );
          })}

          {remainingCount > 0 && (
            <div
              className="absolute -bottom-2 z-20"
              style={{ transform: `translateY(${topNotifications.length * 8}px)` }}
            >
              <Badge
                variant="outline"
                className="rounded-full px-2 shadow-sm border bg-background text-xs"
              >
                +{remainingCount}
              </Badge>
            </div>
          )}

          {/* Spacer to give height to the relative container based on the stacked items */}
          <div className="h-[20px]" />
        </div>
      </div>
    </div>
  );
}
