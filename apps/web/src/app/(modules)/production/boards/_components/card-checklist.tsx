'use client';

import { CheckSquare, Download, Plus, Trash2, X } from 'lucide-react';
import * as React from 'react';
import { toast } from 'sonner';

import { toggleChecklistItem } from '@/app/http/requests/boards';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { Input } from '@/components/ui/input';
import { cn } from '@/lib/utils';

interface ChecklistItemInput {
  id?: string;
  name: string;
  isCompleted: boolean;
}

// Generic interface for budget items that only requires the 'name' field
interface BudgetItemForImport {
  name: string;
}

interface CardChecklistProps {
  /**
   * ID do card (para chamadas de toggle na API quando o card já existe)
   */
  cardId?: string;
  /**
   * Lista de itens do checklist
   */
  items: ChecklistItemInput[];
  /**
   * Callback quando os itens são alterados
   */
  onChange: (items: ChecklistItemInput[]) => void;
  /**
   * Items do orçamento vinculado (para importação) - apenas precisa do campo 'name'
   */
  budgetItems?: BudgetItemForImport[];
  /**
   * Se está no modo de edição (card já existe)
   */
  isEditMode?: boolean;
}

export function CardChecklist({
  cardId,
  items,
  onChange,
  budgetItems,
  isEditMode = false,
}: CardChecklistProps) {
  const [newItemName, setNewItemName] = React.useState('');
  const [isAddingItem, setIsAddingItem] = React.useState(false);
  const inputRef = React.useRef<HTMLInputElement>(null);

  const completedCount = items.filter((item) => item.isCompleted).length;
  const totalCount = items.length;
  const progressPercentage = totalCount > 0 ? Math.round((completedCount / totalCount) * 100) : 0;

  const handleAddItem = () => {
    if (!newItemName.trim()) return;

    const newItem: ChecklistItemInput = {
      name: newItemName.trim(),
      isCompleted: false,
    };

    onChange([...items, newItem]);
    setNewItemName('');
    inputRef.current?.focus();
  };

  const handleRemoveItem = (index: number) => {
    const newItems = items.filter((_, i) => i !== index);
    onChange(newItems);
  };

  const handleToggleItem = async (index: number) => {
    const item = items[index];

    // Se estamos em modo de edição e o item tem ID, usa a API de toggle
    if (isEditMode && cardId && item.id) {
      try {
        await toggleChecklistItem(cardId, item.id);

        // Atualiza localmente após sucesso da API
        const newItems = items.map((it, i) =>
          i === index ? { ...it, isCompleted: !it.isCompleted } : it
        );
        onChange(newItems);
      } catch (error) {
        console.error('Erro ao alternar item:', error);
        toast.error('Erro ao atualizar item');
      }
    } else {
      // Modo de criação ou item novo: apenas atualiza localmente
      const newItems = items.map((it, i) =>
        i === index ? { ...it, isCompleted: !it.isCompleted } : it
      );
      onChange(newItems);
    }
  };

  const handleImportFromBudget = () => {
    if (!budgetItems || budgetItems.length === 0) return;

    const newItems: ChecklistItemInput[] = budgetItems.map((budgetItem) => ({
      name: budgetItem.name,
      isCompleted: false,
    }));

    // Append to existing items
    onChange([...items, ...newItems]);
    toast.success(`${newItems.length} produtos importados do orçamento`);
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      handleAddItem();
    } else if (e.key === 'Escape') {
      setIsAddingItem(false);
      setNewItemName('');
    }
  };

  return (
    <div className="space-y-3">
      {/* Header com progresso */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2 text-sm font-medium">
          <CheckSquare className="h-4 w-4" />
          <span>Checklist</span>
          {totalCount > 0 && (
            <span className="text-muted-foreground">
              ({completedCount}/{totalCount})
            </span>
          )}
        </div>

        {budgetItems && budgetItems.length > 0 && (
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={handleImportFromBudget}
            className="h-7 text-xs"
          >
            <Download className="h-3 w-3 mr-1" />
            Importar do orçamento
          </Button>
        )}
      </div>

      {/* Barra de progresso */}
      {totalCount > 0 && (
        <div className="w-full bg-muted rounded-full h-2 overflow-hidden">
          <div
            className={cn(
              'h-full transition-all duration-300',
              progressPercentage === 100 ? 'bg-green-500' : 'bg-primary'
            )}
            style={{ width: `${progressPercentage}%` }}
          />
        </div>
      )}

      {/* Lista de itens */}
      <div className="space-y-1">
        {items.map((item, index) => (
          <div
            key={item.id || `new-${index}`}
            className={cn(
              'flex items-center gap-2 p-2 rounded-md group hover:bg-muted/50 transition-colors',
              item.isCompleted && 'opacity-60'
            )}
          >
            <Checkbox
              checked={item.isCompleted}
              onCheckedChange={() => handleToggleItem(index)}
              className="shrink-0"
            />
            <span
              className={cn(
                'flex-1 text-sm',
                item.isCompleted && 'line-through text-muted-foreground'
              )}
            >
              {item.name}
            </span>
            <Button
              type="button"
              variant="ghost"
              size="icon"
              onClick={() => handleRemoveItem(index)}
              className="h-6 w-6 opacity-0 group-hover:opacity-100 transition-opacity text-muted-foreground hover:text-destructive"
            >
              <Trash2 className="h-3.5 w-3.5" />
            </Button>
          </div>
        ))}
      </div>

      {/* Input para adicionar item */}
      {isAddingItem ? (
        <div className="flex items-center gap-2">
          <Input
            ref={inputRef}
            value={newItemName}
            onChange={(e) => setNewItemName(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Digite o nome do item..."
            className="h-8 text-sm"
            autoFocus
          />
          <Button
            type="button"
            variant="default"
            size="sm"
            onClick={handleAddItem}
            disabled={!newItemName.trim()}
            className="h-8"
          >
            <Plus className="h-4 w-4" />
          </Button>
          <Button
            type="button"
            variant="ghost"
            size="sm"
            onClick={() => {
              setIsAddingItem(false);
              setNewItemName('');
            }}
            className="h-8"
          >
            <X className="h-4 w-4" />
          </Button>
        </div>
      ) : (
        <Button
          type="button"
          variant="outline"
          size="sm"
          onClick={() => {
            setIsAddingItem(true);
            setTimeout(() => inputRef.current?.focus(), 0);
          }}
          className="w-full justify-start text-muted-foreground"
        >
          <Plus className="h-4 w-4 mr-2" />
          Adicionar item
        </Button>
      )}
    </div>
  );
}
