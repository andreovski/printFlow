'use client';

import { ArrowRightLeft } from 'lucide-react';
import { useState } from 'react';
import { toast } from 'sonner';

import { useBoards, useMoveCard } from '@/app/http/hooks/use-boards';
import { ResponsiveDrawer } from '@/components/responsive-drawer';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';

interface TransferCardDialogProps {
  cardId: string;
  currentBoardId: string;
  currentColumnId: string;
  cardTitle: string;
  isArchived: boolean;
  open?: boolean;
  onOpenChange?: (open: boolean) => void;
  onTransferComplete?: () => void;
}

export function TransferCardDialog({
  cardId,
  currentBoardId,
  currentColumnId,
  cardTitle,
  isArchived,
  open: externalOpen,
  onOpenChange: externalOnOpenChange,
  onTransferComplete,
}: TransferCardDialogProps) {
  const [internalOpen, setInternalOpen] = useState(false);
  const [selectedBoardId, setSelectedBoardId] = useState<string>('');
  const [selectedColumnId, setSelectedColumnId] = useState<string>('');

  const { data: boards } = useBoards();
  const moveCardMutation = useMoveCard();

  // Use external open state if provided, otherwise use internal
  const isOpen = externalOpen !== undefined ? externalOpen : internalOpen;
  const setIsOpen = externalOnOpenChange || setInternalOpen;

  // Filter out current board and only show non-archived boards
  const availableBoards = boards?.filter(
    (board) => board.id !== currentBoardId && !board.isArchived
  );

  // Get columns for selected board
  const selectedBoard = boards?.find((board) => board.id === selectedBoardId);
  const availableColumns = selectedBoard?.columns || [];

  const handleBoardChange = (boardId: string) => {
    setSelectedBoardId(boardId);
    setSelectedColumnId(''); // Reset column selection when board changes
  };

  const handleTransfer = async () => {
    // Prevent transfer if card is archived
    if (isArchived) {
      toast.error('Desarquive o cartão antes de transferi-lo');
      return;
    }

    if (!selectedBoardId || !selectedColumnId) {
      toast.error('Selecione um quadro e uma coluna de destino');
      return;
    }

    // Prevent transfer if current column is the same as destination
    if (selectedColumnId === currentColumnId) {
      toast.error('O cartão já está nesta coluna');
      return;
    }

    try {
      // Get the last position in the destination column
      const destinationColumn = selectedBoard?.columns.find((col) => col.id === selectedColumnId);
      const lastPosition = destinationColumn?.cards?.length || 0;

      await moveCardMutation.mutateAsync({
        cardId,
        destinationColumnId: selectedColumnId,
        newPosition: lastPosition,
      });

      toast.success('Cartão transferido com sucesso');
      setIsOpen(false);
      setSelectedBoardId('');
      setSelectedColumnId('');
      onTransferComplete?.();
    } catch (error) {
      console.error(error);
      toast.error('Erro ao transferir cartão');
    }
  };

  return (
    <ResponsiveDrawer
      open={isOpen}
      onOpenChange={(newOpen) => {
        setIsOpen(newOpen);
        if (!newOpen) {
          setSelectedBoardId('');
          setSelectedColumnId('');
        }
      }}
      title="Transferir Cartão"
      description="Transfira o cartão para outro quadro e coluna."
      className="max-w-[500px]"
    >
      <div className="space-y-6 p-4">
        {/* Current Card Info */}
        <div className="rounded-md border bg-muted/30 p-3">
          <Label className="text-xs text-muted-foreground">Cartão</Label>
          <p className="text-sm font-medium mt-1 truncate">{cardTitle}</p>
        </div>

        {/* Board Selection */}
        <div className="space-y-2">
          <Label>Quadro de Destino</Label>
          <Select value={selectedBoardId} onValueChange={handleBoardChange}>
            <SelectTrigger>
              <SelectValue placeholder="Selecione um quadro..." />
            </SelectTrigger>
            <SelectContent>
              {availableBoards && availableBoards.length > 0 ? (
                availableBoards.map((board) => (
                  <SelectItem key={board.id} value={board.id}>
                    {board.title}
                  </SelectItem>
                ))
              ) : (
                <div className="p-2 text-sm text-muted-foreground text-center">
                  Nenhum quadro disponível
                </div>
              )}
            </SelectContent>
          </Select>
        </div>

        {/* Column Selection */}
        <div className="space-y-2">
          <Label>Coluna de Destino</Label>
          <Select
            value={selectedColumnId}
            onValueChange={setSelectedColumnId}
            disabled={!selectedBoardId}
          >
            <SelectTrigger>
              <SelectValue placeholder="Selecione uma coluna..." />
            </SelectTrigger>
            <SelectContent>
              {availableColumns.length > 0 ? (
                availableColumns.map((column) => (
                  <SelectItem key={column.id} value={column.id}>
                    {column.title}
                  </SelectItem>
                ))
              ) : (
                <div className="p-2 text-sm text-muted-foreground text-center">
                  {selectedBoardId ? 'Nenhuma coluna disponível' : 'Selecione um quadro primeiro'}
                </div>
              )}
            </SelectContent>
          </Select>
        </div>

        {/* Info Message */}
        {selectedBoardId && selectedColumnId && (
          <div className="rounded-md border bg-blue-50 dark:bg-blue-950/20 p-3">
            <p className="text-xs text-blue-700 dark:text-blue-300">
              O cartão será movido para o final da coluna selecionada. Todas as informações,
              incluindo checklist, tags e anexos, serão preservadas.
            </p>
          </div>
        )}

        {/* Actions */}
        <div className="flex gap-2 pt-2">
          <Button
            type="button"
            variant="outline"
            onClick={() => setIsOpen(false)}
            className="flex-1"
            disabled={moveCardMutation.isPending}
          >
            Cancelar
          </Button>
          <Button
            onClick={handleTransfer}
            disabled={!selectedBoardId || !selectedColumnId || moveCardMutation.isPending}
            className="flex-1"
          >
            <ArrowRightLeft className="h-4 w-4 mr-2" />
            Transferir
          </Button>
        </div>
      </div>
    </ResponsiveDrawer>
  );
}
