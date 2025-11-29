'use client';

import { X } from 'lucide-react';
import { useRouter } from 'next/navigation';
import * as React from 'react';

import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  Drawer,
  DrawerContent,
  DrawerDescription,
  DrawerHeader,
  DrawerTitle,
} from '@/components/ui/drawer';
import { useMediaQuery } from '@/hooks/use-media-query';
import { cn } from '@/lib/utils';

export function ResponsiveDrawer({
  children,
  title,
  description,
  className,
  headerIcon,
  open: controlledOpen,
  onOpenChange: controlledOnOpenChange,
  redirectTo,
}: {
  children: React.ReactNode;
  title: string;
  description?: string | React.ReactNode;
  className?: string;
  headerIcon?: React.ReactNode;
  open?: boolean;
  onOpenChange?: (open: boolean) => void;
  redirectTo?: string;
}) {
  const [internalOpen, setInternalOpen] = React.useState(true);
  const isDesktop = useMediaQuery('(min-width: 768px)');
  const router = useRouter();

  const isControlled = controlledOpen !== undefined;
  const open = isControlled ? controlledOpen : internalOpen;

  const onOpenChange = (newOpen: boolean) => {
    if (isControlled) {
      controlledOnOpenChange?.(newOpen);
    } else {
      setInternalOpen(newOpen);
      if (!newOpen) {
        if (redirectTo) {
          router.push(redirectTo);
        } else {
          router.back();
        }
      }
    }
  };

  if (isDesktop) {
    return (
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent
          className={cn('overflow-y-auto scroll-smooth p-0 no-scrollbar', className)}
          style={{ maxHeight: '85vh' }}
        >
          <DialogHeader className="flex-row items-center justify-between">
            <div className="flex flex-col gap-2">
              <DialogTitle className="flex items-center gap-1">
                {headerIcon}
                {title}
              </DialogTitle>
              {description && typeof description === 'string' && (
                <DialogDescription>{description}</DialogDescription>
              )}
              {description && typeof description !== 'string' && description}
            </div>
            <DialogClose asChild>
              <Button variant="ghost">
                <X />
              </Button>
            </DialogClose>
          </DialogHeader>
          {children}
        </DialogContent>
      </Dialog>
    );
  }

  return (
    <Drawer open={open} onOpenChange={onOpenChange}>
      <DrawerContent className="max-h-[85vh] p-0">
        <DrawerHeader className="text-left">
          <DrawerTitle className="flex items-center gap-1">
            {headerIcon}
            {title}
          </DrawerTitle>
          {description && typeof description === 'string' && (
            <DrawerDescription>{description}</DrawerDescription>
          )}
          {description && typeof description !== 'string' && description}
        </DrawerHeader>

        <div className="overflow-y-auto scroll-smooth p-0 no-scrollbar">{children}</div>
      </DrawerContent>
    </Drawer>
  );
}
