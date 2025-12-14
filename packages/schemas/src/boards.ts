import { z } from 'zod';

// Enums
export const cardPriorityEnum = z.enum(['LOW', 'MEDIUM', 'HIGH', 'URGENT']);
export type CardPriority = z.infer<typeof cardPriorityEnum>;

// Checklist Item Schema
export const checklistItemSchema = z.object({
  id: z.string().uuid().optional(),
  name: z.string().min(1, 'O nome é obrigatório'),
  isCompleted: z.boolean().default(false),
});

export type ChecklistItemInput = z.infer<typeof checklistItemSchema>;

// Card Schemas
export const createCardBodySchema = z.object({
  title: z.string().min(1, 'O título é obrigatório'),
  description: z.string().optional(),
  priority: cardPriorityEnum.nullable().optional(),
  dueDate: z.string().datetime().optional().nullable(),
  tagIds: z.array(z.string()).optional(),
  budgetId: z.string().uuid().optional().nullable(),
  checklistItems: z.array(checklistItemSchema).optional(),
});

export const updateCardBodySchema = z.object({
  title: z.string().min(1, 'O título é obrigatório').optional(),
  description: z.string().optional(),
  priority: cardPriorityEnum.nullable().optional(),
  dueDate: z.string().datetime().optional().nullable(),
  tagIds: z.array(z.string()).optional(),
  checklistItems: z.array(checklistItemSchema).optional(),
  // budgetId não pode ser alterado após criação - removido do update
});

export const moveCardBodySchema = z.object({
  cardId: z.string().uuid(),
  destinationColumnId: z.string().uuid(),
  newPosition: z.number().int().min(0),
});

export const moveColumnBodySchema = z.object({
  columnId: z.string().uuid(),
  boardId: z.string().uuid(),
  newOrder: z.number().int().min(0),
});

// Board Schemas
export const createBoardBodySchema = z.object({
  title: z.string().min(1, 'O título é obrigatório'),
  description: z.string().optional(),
});

export const createColumnBodySchema = z.object({
  title: z.string().min(1, 'O título é obrigatório'),
  boardId: z.string().uuid(),
});

// Params Schemas
export const cardIdParamsSchema = z.object({
  id: z.string().uuid(),
});

export const columnIdParamsSchema = z.object({
  columnId: z.string().uuid(),
});

export const checklistItemToggleParamsSchema = z.object({
  cardId: z.string().uuid(),
  itemId: z.string().uuid(),
});

export const archiveCardBodySchema = z.object({
  isArchived: z.boolean(),
});

// Types
export type CreateCardBody = z.infer<typeof createCardBodySchema>;
export type UpdateCardBody = z.infer<typeof updateCardBodySchema>;
export type MoveCardBody = z.infer<typeof moveCardBodySchema>;
export type MoveColumnBody = z.infer<typeof moveColumnBodySchema>;
export type ArchiveCardBody = z.infer<typeof archiveCardBodySchema>;
export type CreateBoardBody = z.infer<typeof createBoardBodySchema>;
export type CreateColumnBody = z.infer<typeof createColumnBodySchema>;
export type CardIdParams = z.infer<typeof cardIdParamsSchema>;
export type ColumnIdParams = z.infer<typeof columnIdParamsSchema>;
export type ChecklistItemToggleParams = z.infer<typeof checklistItemToggleParamsSchema>;

// Response Types
export interface ChecklistItem {
  id: string;
  name: string;
  isCompleted: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface CardBudgetItem {
  id: string;
  name: string;
  quantity: number;
}

export interface CardBudget {
  id: string;
  code: number;
  client: {
    name: string;
    phone: string;
  };
  items: CardBudgetItem[];
}

export interface CardAttachment {
  id: string;
  name: string;
  url: string;
  mimeType: string | null;
}

export interface Card {
  id: string;
  title: string;
  description?: string;
  position: number;
  priority: CardPriority | null;
  dueDate?: string;
  isArchived: boolean;
  columnId: string;
  budgetId?: string | null;
  budget?: CardBudget | null;
  checklistItems?: ChecklistItem[];
  attachments?: CardAttachment[];
  createdAt: string;
  updatedAt: string;
  tags?: any[]; // Using any[] temporarily to avoid circular dependency or import issues, ideally should be Tag[]
}

export interface BoardColumn {
  id: string;
  title: string;
  order: number;
  cards: Card[];
  boardId: string;
  createdAt: string;
  updatedAt: string;
}

export interface Board {
  id: string;
  title: string;
  description?: string;
  isArchived: boolean;
  columns: BoardColumn[];
  organizationId: string;
  createdAt: string;
  updatedAt: string;
}
