import { Button } from './ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from './ui/dialog';

export const DialogAction = ({
  title,
  subtitle,
  onRefuse,
  confirmButton,
  open,
  modal = true,
  disabled = false,
}: {
  title: string;
  subtitle: string;
  onRefuse?: () => void;
  confirmButton: React.ReactNode;
  open: boolean;
  modal?: boolean;
  disabled?: boolean;
}) => {
  return (
    <Dialog open={open} modal={modal}>
      <DialogContent
        className="gap-2 w-[400px] p-3"
        onInteractOutside={(e) => {
          if (disabled) e.preventDefault();
        }}
        onEscapeKeyDown={(e) => {
          if (disabled) e.preventDefault();
        }}
      >
        <DialogHeader className="border-none p-0">
          <DialogTitle>{title}</DialogTitle>
          <DialogDescription>{subtitle}</DialogDescription>
        </DialogHeader>
        <DialogFooter className="p-0">
          <div className="flex gap-2 w-full justify-end">
            <Button variant="outline" onClick={() => onRefuse?.()} disabled={disabled}>
              Cancelar
            </Button>
            {confirmButton}
          </div>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};
