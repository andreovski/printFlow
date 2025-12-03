'use client';

import {
  defineAbilityFor,
  NavigationSubject,
  type NavigationSubjectType,
} from '@magic-system/auth';
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
  Building2,
  Menu,
  type LucideIcon,
} from 'lucide-react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useEffect, useMemo, useState } from 'react';

import { signOutAction } from '@/app/auth/actions';
import { useAppContext } from '@/app/hooks/useAppContext';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { HoverCard, HoverCardContent, HoverCardTrigger } from '@/components/ui/hover-card';
import { Separator } from '@/components/ui/separator';
import { useCookieStorage } from '@/hooks/use-cookie-storage';
import { useDisclosure } from '@/hooks/use-disclosure';
import { cn } from '@/lib/utils';

import { ProfileDrawer } from './profile-drawer';

interface NavItem {
  href: string;
  label: string;
  icon: LucideIcon;
  module: NavigationSubjectType;
}

export function Sidebar() {
  const { organization, user } = useAppContext();

  const userName = user?.name || '';
  const userEmail = user?.email || '';
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

  // State for mobile sidebar
  const [mobileOpen, setMobileOpen] = useState(false);
  const [isMobile, setIsMobile] = useState(false);

  // Detect mobile screen size
  useEffect(() => {
    const checkMobile = () => {
      const mobile = window.innerWidth < 768;
      setIsMobile(mobile);
      if (!mobile) {
        setMobileOpen(false);
      }
    };

    checkMobile();
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  // Handle menu item click - close sidebar on mobile
  const handleMenuClick = () => {
    if (isMobile) {
      setMobileOpen(false);
    }
  };

  const pathname = usePathname();

  // Create ability based on current user
  const ability = useMemo(() => {
    if (!user) return null;
    return defineAbilityFor({
      id: user.id,
      role: user.role,
      organizationId: organization?.id,
    });
  }, [user, organization?.id]);

  // Navigation items with their corresponding CASL subjects
  const registerItems: NavItem[] = [
    {
      href: '/register/clients',
      label: 'Clientes',
      icon: Users,
      module: NavigationSubject.RegisterClients,
    },
    {
      href: '/register/products',
      label: 'Produtos',
      icon: Package,
      module: NavigationSubject.RegisterProducts,
    },
    {
      href: '/register/accesses',
      label: 'Acessos',
      icon: UserCog,
      module: NavigationSubject.RegisterAccesses,
    },
  ];

  const financeItems: NavItem[] = [
    {
      href: '/finance/budgets',
      label: 'Orçamentos',
      icon: FileText,
      module: NavigationSubject.FinanceBudgets,
    },
  ];

  const productionItems: NavItem[] = [
    {
      href: '/production/boards',
      label: 'Quadros',
      icon: Kanban,
      module: NavigationSubject.ProductionBoards,
    },
  ];

  const settingsItems: NavItem[] = [
    {
      href: '/settings/company',
      label: 'Empresa',
      icon: Building2,
      module: NavigationSubject.SettingsCompany,
    },
    {
      href: '/settings/tags',
      label: 'Etiquetas',
      icon: Tags,
      module: NavigationSubject.SettingsTags,
    },
    {
      href: '/settings/templates',
      label: 'Templates',
      icon: FileText,
      module: NavigationSubject.SettingsTemplates,
    },
  ];

  // Filter items based on CASL permissions
  const filterByPermission = (items: NavItem[]) => {
    if (!ability) return [];
    return items.filter((item) => ability.can('access', item.module));
  };

  const filteredRegisterItems = filterByPermission(registerItems);
  const filteredFinanceItems = filterByPermission(financeItems);
  const filteredProductionItems = filterByPermission(productionItems);
  const filteredSettingsItems = filterByPermission(settingsItems);

  // Check if user can access dashboard
  const canAccessDashboard = ability?.can('access', NavigationSubject.Dashboard) ?? false;

  const getInitials = (name: string) => {
    if (!name) return '?';
    const parts = name.trim().split(' ');
    if (parts.length === 1) return parts[0].substring(0, 2).toUpperCase();
    return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
  };

  const LinkClassName = (isActive: boolean) => {
    return cn(
      'flex items-center gap-3 px-3 py-2 rounded-md transition-colors hover:bg-muted',
      isActive ? 'bg-primary/20 text-primary' : 'text-muted-foreground'
    );
  };

  return (
    <>
      {/* Hamburger Menu Button (Mobile Only) */}
      <Button
        variant="secondary"
        size="icon"
        className={cn(
          'fixed bottom-4 left-4 z-50 md:hidden bg-secondary/30 backdrop-blur-sm',
          mobileOpen && 'hidden'
        )}
        onClick={() => setMobileOpen(true)}
      >
        <Menu className="h-6 w-6" />
      </Button>

      {/* Overlay (Mobile Only) */}
      {mobileOpen && isMobile && (
        <div
          className="fixed inset-0 bg-black/50 z-40 md:hidden"
          onClick={() => setMobileOpen(false)}
        />
      )}

      {/* Sidebar */}
      <aside
        className={cn(
          'relative border-r transition-all duration-300 flex flex-col h-[100dvh]',
          // Force expanded on mobile, use collapsed state on desktop
          isMobile ? 'w-64' : collapsed.isOpen ? 'w-16' : 'w-64',
          // Mobile specific styles
          'fixed md:relative z-40',
          isMobile && !mobileOpen && '-translate-x-full',
          isMobile && mobileOpen && 'translate-x-0',
          // Solid background
          'bg-background'
        )}
      >
        {/* Header */}
        <div className="p-4 flex items-center justify-between h-16 border-b">
          {/* On mobile always show expanded, on desktop use collapsed state */}
          {(isMobile || !collapsed.isOpen) && (
            <div className="flex flex-col overflow-hidden">
              <span className="text-lg font-semibold truncate">{organization?.name}</span>
              <span className="font-bold text-xs truncate">
                Print
                <span className="text-xs text-primary mx-0.5">Flow</span>
              </span>
            </div>
          )}
          {/* Hide collapse button on mobile */}
          {!isMobile && (
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
          )}
        </div>

        {/* Navigation */}
        <nav className="flex-1 p-2 space-y-1 overflow-y-auto">
          {/* Dashboard */}
          {canAccessDashboard && (
            <Link
              href="/"
              onClick={handleMenuClick}
              className={cn(
                'flex items-center gap-3 px-3 py-2 rounded-md transition-colors hover:bg-muted',
                pathname === '/' ? 'bg-muted text-foreground' : 'text-muted-foreground',
                !isMobile && collapsed.isOpen && 'justify-center px-2'
              )}
            >
              <LayoutDashboard className="h-5 w-5 shrink-0" />
              {/* Always show text on mobile, on desktop use collapsed state */}
              {(isMobile || !collapsed.isOpen) && <span>Dashboard</span>}
            </Link>
          )}
          {/* Cadastro (Register) Submenu */}
          {filteredRegisterItems.length > 0 && (
            <div className="space-y-1">
              {/* On mobile always show expanded menu, on desktop use collapsed state with hover */}
              {!isMobile && collapsed.isOpen ? (
                <HoverCard openDelay={0} closeDelay={100}>
                  <HoverCardTrigger asChild>
                    <button
                      className={cn(
                        'w-full flex items-center gap-3 py-2 rounded-md transition-colors hover:bg-muted text-muted-foreground justify-center px-2'
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
                            onClick={handleMenuClick}
                            className={LinkClassName(isActive)}
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
                            onClick={handleMenuClick}
                            className={LinkClassName(isActive)}
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
          )}
          {/* Financeiro Submenu */}
          {filteredFinanceItems.length > 0 && (
            <div className="space-y-1">
              {!isMobile && collapsed.isOpen ? (
                <HoverCard openDelay={0} closeDelay={100}>
                  <HoverCardTrigger asChild>
                    <button
                      className={cn(
                        'w-full flex items-center gap-3 py-2 rounded-md transition-colors hover:bg-muted text-muted-foreground justify-center px-2'
                      )}
                    >
                      <DollarSign className="h-5 w-5 shrink-0" />
                    </button>
                  </HoverCardTrigger>
                  <HoverCardContent side="right" align="start" className="w-48 p-2">
                    <div className="px-2 py-1.5 text-sm font-semibold">Financeiro</div>
                    <Separator className="my-1" />
                    <div className="space-y-1">
                      {filteredFinanceItems.map((item) => {
                        const Icon = item.icon;
                        const isActive = pathname.startsWith(item.href);

                        return (
                          <Link
                            key={item.href}
                            href={item.href}
                            onClick={handleMenuClick}
                            className={LinkClassName(isActive)}
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
                      {filteredFinanceItems.map((item) => {
                        const Icon = item.icon;
                        const isActive = pathname.startsWith(item.href);

                        return (
                          <Link
                            key={item.href}
                            href={item.href}
                            onClick={handleMenuClick}
                            className={LinkClassName(isActive)}
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
          )}
          {/* Produção Submenu */}
          {filteredProductionItems.length > 0 && (
            <div className="space-y-1">
              {!isMobile && collapsed.isOpen ? (
                <HoverCard openDelay={0} closeDelay={100}>
                  <HoverCardTrigger asChild>
                    <button
                      className={cn(
                        'w-full flex items-center gap-3 py-2 rounded-md transition-colors hover:bg-muted text-muted-foreground justify-center px-2'
                      )}
                    >
                      <Package className="h-5 w-5 shrink-0" />
                    </button>
                  </HoverCardTrigger>
                  <HoverCardContent side="right" align="start" className="w-48 p-2">
                    <div className="px-2 py-1.5 text-sm font-semibold">Produção</div>
                    <Separator className="my-1" />
                    <div className="space-y-1">
                      {filteredProductionItems.map((item) => {
                        const Icon = item.icon;
                        const isActive = pathname.startsWith(item.href);

                        return (
                          <Link
                            key={item.href}
                            href={item.href}
                            onClick={handleMenuClick}
                            className={LinkClassName(isActive)}
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
                      {filteredProductionItems.map((item) => {
                        const Icon = item.icon;
                        const isActive = pathname.startsWith(item.href);

                        return (
                          <Link
                            key={item.href}
                            href={item.href}
                            onClick={handleMenuClick}
                            className={LinkClassName(isActive)}
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
          )}
          {/* Configurações Submenu */}
          {filteredSettingsItems.length > 0 && (
            <div className="space-y-1">
              {!isMobile && collapsed.isOpen ? (
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
                      {filteredSettingsItems.map((item) => {
                        const Icon = item.icon;
                        const isActive = pathname.startsWith(item.href);

                        return (
                          <Link
                            key={item.href}
                            href={item.href}
                            onClick={handleMenuClick}
                            className={LinkClassName(isActive)}
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
                      {filteredSettingsItems.map((item) => {
                        const Icon = item.icon;
                        const isActive = pathname.startsWith(item.href);

                        return (
                          <Link
                            key={item.href}
                            href={item.href}
                            onClick={handleMenuClick}
                            className={LinkClassName(isActive)}
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
          )}
        </nav>

        {/* User Profile */}
        <div className="p-4 border-t">
          <div
            className={cn(
              'flex items-center gap-3',
              !isMobile && collapsed.isOpen && 'justify-center'
            )}
          >
            <Avatar>
              <AvatarFallback className="bg-primary text-primary-foreground font-semibold">
                {getInitials(userName || userEmail || 'User')}
              </AvatarFallback>
            </Avatar>
            {(isMobile || !collapsed.isOpen) && (
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium truncate">{userName || 'Usuário'}</p>
                <p className="text-xs text-muted-foreground truncate">{userEmail || 'Sem email'}</p>
              </div>
            )}
            {(isMobile || !collapsed.isOpen) && (
              <ProfileDrawer
                trigger={
                  <Button variant="ghost" size="icon">
                    <UserCog className="h-4 w-4 shrink-0" />
                  </Button>
                }
              />
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
                !isMobile && collapsed.isOpen && 'justify-center px-0'
              )}
            >
              <LogOut className="h-5 w-5 shrink-0" />
              {(isMobile || !collapsed.isOpen) && <span>Sair</span>}
            </Button>
          </form>
        </div>
      </aside>
    </>
  );
}
