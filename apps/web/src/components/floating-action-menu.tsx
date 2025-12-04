'use client';

import { ChevronLeft, ChevronRight, FilePlus, PackagePlus, UserRoundPlus } from 'lucide-react';
import { useEffect, useState } from 'react';

import { BudgetForm } from '@/app/(modules)/finance/budgets/_components/budget-form';
import { ClientForm } from '@/app/(modules)/register/clients/_components/client-form';
import { ProductForm } from '@/app/(modules)/register/products/_components/product-form';
import { ResponsiveDrawer } from '@/components/responsive-drawer';
import { Button } from '@/components/ui/button';
import { useLocalStorage } from '@/hooks/use-local-storage';
import { cn } from '@/lib/utils';

type DialogType = 'client' | 'product' | 'budget' | null;

export function FloatingActionMenu() {
  const [isExpanded, setIsExpanded] = useState(true);
  const [openDialog, setOpenDialog] = useState<DialogType>(null);
  const [isEnabled] = useLocalStorage('floating-menu-enabled', true);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted || !isEnabled) return null;

  const menuItems = [
    {
      icon: UserRoundPlus,
      label: 'Criar Cliente',
      type: 'client' as DialogType,
      hoverColor: 'hover:from-blue-600 hover:to-cyan-600',
    },
    {
      icon: PackagePlus,
      label: 'Criar Produto',
      type: 'product' as DialogType,
      hoverColor: 'hover:from-purple-600 hover:to-pink-600',
    },
    {
      icon: FilePlus,
      label: 'Criar Orçamento',
      type: 'budget' as DialogType,
      hoverColor: 'hover:from-orange-600 hover:to-red-600',
    },
  ];

  const handleOpenDialog = (type: DialogType) => {
    setOpenDialog(type);
  };

  const handleCloseDialog = () => {
    setOpenDialog(null);
  };

  return (
    <>
      <div className="fixed bottom-2 right-4 z-50">
        <div className="flex items-center gap-4 bg-background/35 backdrop-blur-md p-2 rounded-full shadow-2xl border border-border/50 transition-all duration-300">
          {/* Toggle Button */}
          <Button
            onClick={() => setIsExpanded(!isExpanded)}
            className={cn(
              'h-12 w-12 rounded-full transition-all duration-200',
              'hover:shadow-xl hover:scale-110',
              !isExpanded && '-mr-4'
            )}
            size="icon"
            variant="ghost"
            title={isExpanded ? 'Colapsar menu' : 'Expandir menu'}
          >
            {isExpanded ? (
              <ChevronRight className="text-foreground" />
            ) : (
              <ChevronLeft className="text-foreground" />
            )}
          </Button>

          {/* Menu Items */}
          <div
            className={cn(
              'flex items-center gap-1 overflow-hidden transition-all duration-300 ease-in-out',
              isExpanded
                ? 'max-w-[220px] opacity-100 ml-2'
                : 'max-w-0 opacity-0 ml-0 pointer-events-none'
            )}
          >
            {menuItems.map((item) => {
              const Icon = item.icon;
              return (
                <Button
                  key={item.type}
                  onClick={() => handleOpenDialog(item.type)}
                  className={cn(
                    'h-10 w-10 rounded-full transition-all duration-200',
                    'hover:shadow-2xl hover:scale-110',
                    'flex-shrink-0 my-1 mx-0.5'
                  )}
                  size="icon"
                  variant="outline"
                  title={item.label}
                >
                  <Icon className="h-5 w-5  text-foreground" />
                </Button>
              );
            })}
          </div>
        </div>
      </div>

      {/* Dialogs */}
      <ResponsiveDrawer
        title="Criar Cliente"
        description="Preencha os dados abaixo para criar um novo cliente."
        className="max-w-[900px] md:w-[60vw]"
        headerIcon={<UserRoundPlus />}
        open={openDialog === 'client'}
        onOpenChange={(open) => !open && handleCloseDialog()}
      >
        <ClientForm onSuccess={handleCloseDialog} />
      </ResponsiveDrawer>

      <ResponsiveDrawer
        title="Criar Produto"
        description="Preencha os dados abaixo para criar um novo produto."
        className="max-w-[900px] md:w-[60vw]"
        headerIcon={<PackagePlus className="w-5 h-5" />}
        open={openDialog === 'product'}
        onOpenChange={(open) => !open && handleCloseDialog()}
      >
        <ProductForm onSuccess={handleCloseDialog} />
      </ResponsiveDrawer>

      <ResponsiveDrawer
        title="Novo Orçamento"
        description="Crie um novo orçamento para um cliente."
        className="max-w-[1200px] md:w-[80vw]"
        headerIcon={<FilePlus />}
        open={openDialog === 'budget'}
        onOpenChange={(open) => !open && handleCloseDialog()}
      >
        <BudgetForm onSuccess={handleCloseDialog} />
      </ResponsiveDrawer>
    </>
  );
}
