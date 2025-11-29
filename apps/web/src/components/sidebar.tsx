'use client';

import {
  LayoutDashboard,
  Package,
  Users,
  ChevronLeft,
  ChevronRight,
  ChevronDown,
  ChevronUp,
  LogOut,
  UserCog,
  FolderOpen,
  FileText,
  DollarSign,
  Settings,
  Tags,
  Kanban,
} from 'lucide-react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';

import { signOutAction } from '@/app/auth/actions';
import { useAppContext } from '@/app/hooks/useAppContext';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { HoverCard, HoverCardContent, HoverCardTrigger } from '@/components/ui/hover-card';
import { Separator } from '@/components/ui/separator';
import { useCookieStorage } from '@/hooks/use-cookie-storage';
import { useDisclosure } from '@/hooks/use-disclosure';
import { cn } from '@/lib/utils';

interface SidebarProps {
  role?: string;
  userName?: string;
  userEmail?: string;
}

export function Sidebar({ role, userName, userEmail }: SidebarProps) {
  const { organization } = useAppContext();
  const { value: collapsedValue, setValue: setCollapsedValue } =
    useCookieStorage('collapsed-sidebar');

  const registerOpen = useDisclosure({ opened: true });
  const financeOpen = useDisclosure({ opened: true });
  const productionOpen = useDisclosure({ opened: true });
  const settingsOpen = useDisclosure({ opened: true });

  const collapsed = useDisclosure({
    opened: collapsedValue === 'true',
    onOpen: (isOpen: boolean) => {
      setCollapsedValue(`${isOpen}`);
    },
    onClose: (isOpen: boolean) => {
      setCollapsedValue(`${isOpen}`);
    },
  });

  const pathname = usePathname();

  const registerItems = [
    { href: '/register/clients', label: 'Clientes', icon: Users },
    { href: '/register/products', label: 'Produtos', icon: Package },
    { href: '/register/accesses', label: 'Acessos', icon: UserCog, requiresRole: true },
  ];

  const financeItems = [{ href: '/finance/budgets', label: 'Orçamentos', icon: FileText }];
  const productionItems = [{ href: '/production/boards', label: 'Quadros', icon: Kanban }];
  const settingsItems = [
    { href: '/settings/tags', label: 'Etiquetas', icon: Tags },
    { href: '/settings/templates', label: 'Templates', icon: FileText },
  ];

  const filteredRegisterItems = registerItems.filter((item) => {
    if (item.requiresRole) {
      return role === 'ADMIN' || role === 'MASTER';
    }
    return true;
  });

  const getInitials = (name: string) => {
    if (!name) return '?';
    const parts = name.trim().split(' ');
    if (parts.length === 1) return parts[0].substring(0, 2).toUpperCase();
    return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
  };

  return (
    <aside
      className={cn(
        'relative border-r bg-muted/10 transition-all duration-300 flex flex-col h-screen',
        collapsed.isOpen ? 'w-16' : 'w-full sm:w-64'
      )}
    >
      {/* Header */}
      <div className="p-4 flex items-center justify-between h-16 border-b">
        {!collapsed.isOpen && (
          <div className="flex flex-col">
            <span className="text-lg font-semibold truncate">{organization?.name}</span>
            <span className="font-bold text-xs truncate">
              Print
              <span className="text-xs text-primary mx-0.5">Flow</span>
            </span>
          </div>
        )}
        <Button
          variant="ghost"
          size="icon"
          className={cn('h-8 w-8', collapsed.isOpen && 'mx-auto')}
          onClick={() => collapsed.toggle()}
        >
          {collapsed.isOpen ? (
            <ChevronRight className="h-4 w-4" />
          ) : (
            <ChevronLeft className="h-4 w-4" />
          )}
        </Button>
      </div>

      {/* Navigation */}
      <nav className="flex-1 p-2 space-y-1 overflow-y-auto">
        {/* Dashboard */}
        <Link
          href="/"
          className={cn(
            'flex items-center gap-3 px-3 py-2 rounded-md transition-colors hover:bg-muted',
            pathname === '/' ? 'bg-muted text-foreground' : 'text-muted-foreground',
            collapsed.isOpen && 'justify-center px-2'
          )}
        >
          <LayoutDashboard className="h-5 w-5 shrink-0" />
          {!collapsed.isOpen && <span>Dashboard</span>}
        </Link>
        {/* Cadastro (Register) Submenu */}
        <div className="space-y-1">
          {collapsed.isOpen ? (
            <HoverCard openDelay={0} closeDelay={100}>
              <HoverCardTrigger asChild>
                <button
                  className={cn(
                    'w-full flex items-center gap-3 px-3 py-2 rounded-md transition-colors hover:bg-muted text-muted-foreground justify-center px-2'
                  )}
                >
                  <FolderOpen className="h-5 w-5 shrink-0" />
                </button>
              </HoverCardTrigger>
              <HoverCardContent side="right" align="start" className="w-48 p-2">
                <div className="px-2 py-1.5 text-sm font-semibold">Cadastro</div>
                <Separator className="my-1" />
                <div className="space-y-1">
                  {filteredRegisterItems.map((item) => {
                    const Icon = item.icon;
                    const isActive = pathname.startsWith(item.href);

                    return (
                      <Link
                        key={item.href}
                        href={item.href}
                        className={cn(
                          'flex items-center gap-2 px-2 py-1.5 rounded-sm text-sm transition-colors hover:bg-accent hover:text-accent-foreground cursor-pointer',
                          isActive ? 'bg-muted text-foreground' : 'text-muted-foreground'
                        )}
                      >
                        <Icon className="h-4 w-4" />
                        <span>{item.label}</span>
                      </Link>
                    );
                  })}
                </div>
              </HoverCardContent>
            </HoverCard>
          ) : (
            <>
              <button
                onClick={() => registerOpen.toggle()}
                className={cn(
                  'w-full flex items-center gap-3 px-3 py-2 rounded-md transition-colors hover:bg-muted text-muted-foreground'
                )}
              >
                <FolderOpen className="h-5 w-5 shrink-0" />
                <span className="flex-1 text-left">Cadastro</span>
                {registerOpen.isOpen ? (
                  <ChevronUp className="h-4 w-4 shrink-0" />
                ) : (
                  <ChevronDown className="h-4 w-4 shrink-0" />
                )}
              </button>

              {/* Submenu items */}
              {registerOpen.isOpen && (
                <div className="ml-4 space-y-1">
                  {filteredRegisterItems.map((item) => {
                    const Icon = item.icon;
                    const isActive = pathname.startsWith(item.href);

                    return (
                      <Link
                        key={item.href}
                        href={item.href}
                        className={cn(
                          'flex items-center gap-3 px-3 py-2 rounded-md transition-colors hover:bg-muted',
                          isActive ? 'bg-muted text-foreground' : 'text-muted-foreground'
                        )}
                      >
                        <Icon className="h-4 w-4 shrink-0" />
                        <span className="text-sm">{item.label}</span>
                      </Link>
                    );
                  })}
                </div>
              )}
            </>
          )}
        </div>
        {/* Financeiro Submenu */}
        <div className="space-y-1">
          {collapsed.isOpen ? (
            <HoverCard openDelay={0} closeDelay={100}>
              <HoverCardTrigger asChild>
                <button
                  className={cn(
                    'w-full flex items-center gap-3 px-3 py-2 rounded-md transition-colors hover:bg-muted text-muted-foreground justify-center px-2'
                  )}
                >
                  <DollarSign className="h-5 w-5 shrink-0" />
                </button>
              </HoverCardTrigger>
              <HoverCardContent side="right" align="start" className="w-48 p-2">
                <div className="px-2 py-1.5 text-sm font-semibold">Financeiro</div>
                <Separator className="my-1" />
                <div className="space-y-1">
                  {financeItems.map((item) => {
                    const Icon = item.icon;
                    const isActive = pathname.startsWith(item.href);

                    return (
                      <Link
                        key={item.href}
                        href={item.href}
                        className={cn(
                          'flex items-center gap-2 px-2 py-1.5 rounded-sm text-sm transition-colors hover:bg-accent hover:text-accent-foreground cursor-pointer',
                          isActive ? 'bg-muted text-foreground' : 'text-muted-foreground'
                        )}
                      >
                        <Icon className="h-4 w-4" />
                        <span>{item.label}</span>
                      </Link>
                    );
                  })}
                </div>
              </HoverCardContent>
            </HoverCard>
          ) : (
            <>
              <button
                onClick={() => financeOpen.toggle()}
                className={cn(
                  'w-full flex items-center gap-3 px-3 py-2 rounded-md transition-colors hover:bg-muted text-muted-foreground'
                )}
              >
                <DollarSign className="h-5 w-5 shrink-0" />
                <span className="flex-1 text-left">Financeiro</span>
                {financeOpen.isOpen ? (
                  <ChevronUp className="h-4 w-4 shrink-0" />
                ) : (
                  <ChevronDown className="h-4 w-4 shrink-0" />
                )}
              </button>

              {/* Submenu items */}
              {financeOpen.isOpen && (
                <div className="ml-4 space-y-1">
                  {financeItems.map((item) => {
                    const Icon = item.icon;
                    const isActive = pathname.startsWith(item.href);

                    return (
                      <Link
                        key={item.href}
                        href={item.href}
                        className={cn(
                          'flex items-center gap-3 px-3 py-2 rounded-md transition-colors hover:bg-muted',
                          isActive ? 'bg-muted text-foreground' : 'text-muted-foreground'
                        )}
                      >
                        <Icon className="h-4 w-4 shrink-0" />
                        <span className="text-sm">{item.label}</span>
                      </Link>
                    );
                  })}
                </div>
              )}
            </>
          )}
        </div>
        {/* Produção Submenu */}
        <div className="space-y-1">
          {collapsed.isOpen ? (
            <HoverCard openDelay={0} closeDelay={100}>
              <HoverCardTrigger asChild>
                <button
                  className={cn(
                    'w-full flex items-center gap-3 px-3 py-2 rounded-md transition-colors hover:bg-muted text-muted-foreground justify-center px-2'
                  )}
                >
                  <Package className="h-5 w-5 shrink-0" />
                </button>
              </HoverCardTrigger>
              <HoverCardContent side="right" align="start" className="w-48 p-2">
                <div className="px-2 py-1.5 text-sm font-semibold">Produção</div>
                <Separator className="my-1" />
                <div className="space-y-1">
                  {productionItems.map((item) => {
                    const Icon = item.icon;
                    const isActive = pathname.startsWith(item.href);

                    return (
                      <Link
                        key={item.href}
                        href={item.href}
                        className={cn(
                          'flex items-center gap-2 px-2 py-1.5 rounded-sm text-sm transition-colors hover:bg-accent hover:text-accent-foreground cursor-pointer',
                          isActive ? 'bg-muted text-foreground' : 'text-muted-foreground'
                        )}
                      >
                        <Icon className="h-4 w-4" />
                        <span>{item.label}</span>
                      </Link>
                    );
                  })}
                </div>
              </HoverCardContent>
            </HoverCard>
          ) : (
            <>
              <button
                onClick={() => productionOpen.toggle()}
                className={cn(
                  'w-full flex items-center gap-3 px-3 py-2 rounded-md transition-colors hover:bg-muted text-muted-foreground'
                )}
              >
                <Package className="h-5 w-5 shrink-0" />
                <span className="flex-1 text-left">Produção</span>
                {productionOpen.isOpen ? (
                  <ChevronUp className="h-4 w-4 shrink-0" />
                ) : (
                  <ChevronDown className="h-4 w-4 shrink-0" />
                )}
              </button>

              {/* Submenu items */}
              {productionOpen.isOpen && (
                <div className="ml-4 space-y-1">
                  {productionItems.map((item) => {
                    const Icon = item.icon;
                    const isActive = pathname.startsWith(item.href);

                    return (
                      <Link
                        key={item.href}
                        href={item.href}
                        className={cn(
                          'flex items-center gap-3 px-3 py-2 rounded-md transition-colors hover:bg-muted',
                          isActive ? 'bg-muted text-foreground' : 'text-muted-foreground'
                        )}
                      >
                        <Icon className="h-4 w-4 shrink-0" />
                        <span className="text-sm">{item.label}</span>
                      </Link>
                    );
                  })}
                </div>
              )}
            </>
          )}
        </div>
        {/* Configurações Submenu */}
        <div className="space-y-1">
          {collapsed.isOpen ? (
            <HoverCard openDelay={0} closeDelay={100}>
              <HoverCardTrigger asChild>
                <button
                  className={cn(
                    'w-full flex items-center gap-3 py-2 rounded-md transition-colors hover:bg-muted text-muted-foreground justify-center px-2'
                  )}
                >
                  <Settings className="h-5 w-5 shrink-0" />
                </button>
              </HoverCardTrigger>
              <HoverCardContent side="right" align="start" className="w-48 p-2">
                <div className="px-2 py-1.5 text-sm font-semibold">Configurações</div>
                <Separator className="my-1" />
                <div className="space-y-1">
                  {settingsItems.map((item) => {
                    const Icon = item.icon;
                    const isActive = pathname.startsWith(item.href);

                    return (
                      <Link
                        key={item.href}
                        href={item.href}
                        className={cn(
                          'flex items-center gap-2 px-2 py-1.5 rounded-sm text-sm transition-colors hover:bg-accent hover:text-accent-foreground cursor-pointer',
                          isActive ? 'bg-muted text-foreground' : 'text-muted-foreground'
                        )}
                      >
                        <Icon className="h-4 w-4" />
                        <span>{item.label}</span>
                      </Link>
                    );
                  })}
                </div>
              </HoverCardContent>
            </HoverCard>
          ) : (
            <>
              <button
                onClick={() => settingsOpen.toggle()}
                className={cn(
                  'w-full flex items-center gap-3 px-3 py-2 rounded-md transition-colors hover:bg-muted text-muted-foreground'
                )}
              >
                <Settings className="h-5 w-5 shrink-0" />
                <span className="flex-1 text-left">Configurações</span>
                {settingsOpen.isOpen ? (
                  <ChevronUp className="h-4 w-4 shrink-0" />
                ) : (
                  <ChevronDown className="h-4 w-4 shrink-0" />
                )}
              </button>

              {/* Submenu items */}
              {settingsOpen.isOpen && (
                <div className="ml-4 space-y-1">
                  {settingsItems.map((item) => {
                    const Icon = item.icon;
                    const isActive = pathname.startsWith(item.href);

                    return (
                      <Link
                        key={item.href}
                        href={item.href}
                        className={cn(
                          'flex items-center gap-3 px-3 py-2 rounded-md transition-colors hover:bg-muted',
                          isActive ? 'bg-muted text-foreground' : 'text-muted-foreground'
                        )}
                      >
                        <Icon className="h-4 w-4 shrink-0" />
                        <span className="text-sm">{item.label}</span>
                      </Link>
                    );
                  })}
                </div>
              )}
            </>
          )}
        </div>
      </nav>

      {/* User Profile */}
      <div className="p-4 border-t">
        <div className={cn('flex items-center gap-3', collapsed.isOpen && 'justify-center')}>
          <Avatar>
            <AvatarFallback className="bg-primary text-primary-foreground font-semibold">
              {getInitials(userName || userEmail || 'User')}
            </AvatarFallback>
          </Avatar>
          {!collapsed.isOpen && (
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium truncate">{userName || 'Usuário'}</p>
              <p className="text-xs text-muted-foreground truncate">{userEmail || 'Sem email'}</p>
            </div>
          )}
          {!collapsed.isOpen && (
            <Button variant="ghost" asChild>
              <Link href="/settings">
                <UserCog className="h-4 w-4 shrink-0" />
              </Link>
            </Button>
          )}
        </div>
      </div>

      {/* Logout */}
      <div className="p-4 border-t">
        <form action={signOutAction}>
          <Button
            variant="ghost"
            className={cn(
              'w-full flex items-center gap-3 justify-start text-muted-foreground hover:text-foreground',
              collapsed.isOpen && 'justify-center px-0'
            )}
          >
            <LogOut className="h-5 w-5 shrink-0" />
            {!collapsed.isOpen && <span>Sair</span>}
          </Button>
        </form>
      </div>
    </aside>
  );
}
