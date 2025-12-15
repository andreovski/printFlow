'use client';

import type { BoardSummary } from '@magic-system/schemas';
import {
  Archive,
  ArchiveRestore,
  ChevronDown,
  ChevronUp,
  Edit2,
  Kanban,
  LayoutGrid,
  Loader2,
  MoreVertical,
  Plus,
  Trash2,
} from 'lucide-react';
import { useEffect, useState } from 'react';
import { toast } from 'sonner';

import { useBoardsSummary, useDeleteBoard, useUpdateBoard } from '@/app/http/hooks/use-boards';
import { DialogAction } from '@/components/dialog-action';
import { ResponsiveDrawer } from '@/components/responsive-drawer';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
  Pagination,
  PaginationContent,
  PaginationItem,
  PaginationLink,
  PaginationNext,
  PaginationPrevious,
} from '@/components/ui/pagination';
import { useAppContext } from '@/hooks/use-app-context';
import { useDisclosure } from '@/hooks/use-disclosure';

import { BoardEditForm } from './board-edit-form';
import { CreateBoardDialog } from './create-board-dialog';

interface BoardManagementModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onBoardSelect: (boardId: string) => void;
}

const AVATAR_COLORS = [
  'bg-blue-500',
  'bg-green-500',
  'bg-purple-500',
  'bg-orange-500',
  'bg-pink-500',
  'bg-teal-500',
  'bg-indigo-500',
  'bg-rose-500',
];

function getAvatarColor(title: string): string {
  const index = title.charCodeAt(0) % AVATAR_COLORS.length;
  return AVATAR_COLORS[index];
}

type ViewMode = 'list' | 'edit';

export function BoardManagementModal({
  open,
  onOpenChange,
  onBoardSelect,
}: BoardManagementModalProps) {
  const [page, setPage] = useState(1);
  const [archivedOpen, setArchivedOpen] = useState(false);
  const [viewMode, setViewMode] = useState<ViewMode>('list');
  const [editingBoard, setEditingBoard] = useState<BoardSummary | null>(null);
  const pageSize = 5;

  const { user } = useAppContext();
  const isAdmin = user?.role === 'ADMIN' || user?.role === 'MASTER';

  const { data, isLoading, isFetching } = useBoardsSummary({
    page,
    pageSize,
    includeArchived: true,
    enabled: open,
  });

  const deleteDisclosure = useDisclosure();
  const archiveDisclosure = useDisclosure();

  const deleteBoardMutation = useDeleteBoard();
  const updateBoardMutation = useUpdateBoard();

  const activeBoards = data?.data.filter((b) => !b.isArchived) || [];
  const archivedBoards = data?.data.filter((b) => b.isArchived) || [];

  // Reset view mode when modal closes
  useEffect(() => {
    if (!open) {
      setViewMode('list');
      setEditingBoard(null);
    }
  }, [open]);

  const handleEditBoard = (board: BoardSummary) => {
    setEditingBoard(board);
    setViewMode('edit');
  };

  const handleBackToList = () => {
    setViewMode('list');
    setEditingBoard(null);
  };

  const handleDeleteBoard = async () => {
    if (!deleteDisclosure.state) return;

    try {
      await deleteBoardMutation.mutateAsync(deleteDisclosure.state.id);
      toast.success('Quadro excluído com sucesso');
      deleteDisclosure.close();
      if (viewMode === 'edit') {
        handleBackToList();
      }
    } catch (error) {
      console.error(error);
      toast.error('Erro ao excluir quadro');
    }
  };

  const handleArchiveBoard = async () => {
    if (!archiveDisclosure.state) return;

    try {
      await updateBoardMutation.mutateAsync({
        id: archiveDisclosure.state.id,
        data: { isArchived: true },
      });
      toast.success('Quadro arquivado com sucesso');
      archiveDisclosure.close();
    } catch (error) {
      console.error(error);
      toast.error('Erro ao arquivar quadro');
    }
  };

  const handleRestoreBoard = async (board: BoardSummary) => {
    try {
      await updateBoardMutation.mutateAsync({
        id: board.id,
        data: { isArchived: false },
      });
      toast.success('Quadro restaurado com sucesso');
    } catch (error) {
      console.error(error);
      toast.error('Erro ao restaurar quadro');
    }
  };

  const handleGoToBoard = (boardId: string) => {
    onBoardSelect(boardId);
    onOpenChange(false);
  };

  const renderBoardCard = (board: BoardSummary, isArchived = false) => (
    <Card
      key={board.id}
      className={`group relative transition-all hover:shadow-md ${isArchived ? 'opacity-70' : ''}`}
    >
      <CardHeader className="px-4 py-2">
        <div className="flex items-start justify-between">
          <div className="flex items-center gap-3">
            <Avatar className={`h-10 w-10 ${getAvatarColor(board.title)}`}>
              <AvatarFallback className="bg-transparent text-white font-semibold">
                {board.title.charAt(0).toUpperCase()}
              </AvatarFallback>
            </Avatar>
            <div className="flex flex-col">
              <CardTitle className="text-base">{board.title}</CardTitle>
              <Badge variant={isArchived ? 'secondary' : 'outline'} className="w-fit mt-1 text-xs">
                {isArchived ? 'Arquivado' : 'Ativo'}
              </Badge>
            </div>
          </div>

          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="icon" className="h-8 w-8">
                <MoreVertical className="h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem
                onSelect={(e) => {
                  e.preventDefault();
                  handleEditBoard(board);
                }}
              >
                <Edit2 className="h-4 w-4 mr-2" />
                Editar
              </DropdownMenuItem>

              {!isArchived && (
                <DropdownMenuItem
                  onSelect={(e) => {
                    e.preventDefault();
                    archiveDisclosure.open({ state: board });
                  }}
                >
                  <Archive className="h-4 w-4 mr-2" />
                  Arquivar
                </DropdownMenuItem>
              )}

              {isArchived && (
                <DropdownMenuItem
                  onSelect={(e) => {
                    e.preventDefault();
                    handleRestoreBoard(board);
                  }}
                >
                  <ArchiveRestore className="h-4 w-4 mr-2" />
                  Restaurar
                </DropdownMenuItem>
              )}

              {isAdmin && (
                <>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem
                    className="text-destructive focus:text-destructive"
                    onSelect={(e) => {
                      e.preventDefault();
                      deleteDisclosure.open({ state: board });
                    }}
                  >
                    <Trash2 className="h-4 w-4 mr-2" />
                    Excluir
                  </DropdownMenuItem>
                </>
              )}
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </CardHeader>

      <CardContent className="px-2 py-1">
        <CardDescription className="line-clamp-2 min-h-[2.5rem]">
          {board.description || 'Sem descrição'}
        </CardDescription>
      </CardContent>

      <CardFooter className="flex items-center justify-between border-t py-2 px-4 h-[45px]">
        <div className="flex gap-4 text-sm text-muted-foreground" title="Total de colunas">
          <div className="flex items-center gap-1">
            <Kanban className="h-4 w-4" />
            <span>{board.totalColumns}</span>
          </div>
          <div className="flex items-center gap-1" title="Total de cartões">
            <div className="h-3 w-3 rounded border-2 border-current" />
            <span>{board.totalCards}</span>
          </div>
          {board.totalArchivedCards > 0 && (
            <div className="flex items-center gap-1" title="Total de cartões arquivados">
              <Archive className="h-3.5 w-3.5" />
              <span>{board.totalArchivedCards}</span>
            </div>
          )}
        </div>

        {!isArchived && (
          <Button variant="ghost" size="sm" onClick={() => handleEditBoard(board)}>
            <Edit2 className="h-4 w-4" />
            Editar
          </Button>
        )}
      </CardFooter>
    </Card>
  );

  const renderPagination = () => {
    if (!data?.meta || data.meta.totalPages <= 1) return null;

    const { page: currentPage, totalPages } = data.meta;

    const getPageNumbers = () => {
      const pages: (number | 'ellipsis')[] = [];

      if (totalPages <= 5) {
        for (let i = 1; i <= totalPages; i++) pages.push(i);
      } else {
        pages.push(1);
        if (currentPage > 3) pages.push('ellipsis');

        const start = Math.max(2, currentPage - 1);
        const end = Math.min(totalPages - 1, currentPage + 1);

        for (let i = start; i <= end; i++) pages.push(i);

        if (currentPage < totalPages - 2) pages.push('ellipsis');
        pages.push(totalPages);
      }

      return pages;
    };

    return (
      <div className="flex items-center justify-between mt-6">
        <p className="text-sm text-muted-foreground w-full">
          Mostrando {activeBoards.length} de {data.meta.total} quadros
        </p>
        <Pagination>
          <PaginationContent>
            <PaginationItem>
              <PaginationPrevious
                onClick={() => setPage((p) => Math.max(1, p - 1))}
                className={currentPage === 1 ? 'pointer-events-none opacity-50' : 'cursor-pointer'}
              />
            </PaginationItem>

            {getPageNumbers().map((pageNum, index) =>
              pageNum === 'ellipsis' ? (
                <PaginationItem key={`ellipsis-${index}`}>
                  <span className="px-2">...</span>
                </PaginationItem>
              ) : (
                <PaginationItem key={pageNum}>
                  <PaginationLink
                    isActive={currentPage === pageNum}
                    onClick={() => setPage(pageNum)}
                    className="cursor-pointer"
                  >
                    {pageNum}
                  </PaginationLink>
                </PaginationItem>
              )
            )}

            <PaginationItem>
              <PaginationNext
                onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                className={
                  currentPage === totalPages ? 'pointer-events-none opacity-50' : 'cursor-pointer'
                }
              />
            </PaginationItem>
          </PaginationContent>
        </Pagination>
      </div>
    );
  };

  const renderListView = () => (
    <div className="flex flex-col h-full px-4 py-2 min-h-[520px]">
      <div className="px-1">
        {isLoading ? (
          <div className="flex items-center justify-center py-12">
            <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
          </div>
        ) : (
          <>
            {/* Active Boards */}
            <div className="space-y-4">
              <div className="flex items-center gap-2">
                <LayoutGrid className="h-5 w-5" />
                <h3 className="font-semibold">Quadros disponíveis</h3>
                {isFetching && <Loader2 className="h-4 w-4 animate-spin" />}
              </div>

              {activeBoards.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-12 border rounded-lg border-dashed">
                  <LayoutGrid className="h-12 w-12 text-muted-foreground mb-4" />
                  <p className="text-muted-foreground">Nenhum quadro encontrado</p>
                  <p className="text-sm text-muted-foreground">
                    Crie seu primeiro quadro para começar
                  </p>
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                  {activeBoards.map((board) => renderBoardCard(board))}

                  {/* Create new board card */}
                  <CreateBoardDialog
                    onBoardCreated={(newBoard) => {
                      handleGoToBoard(newBoard.id);
                    }}
                  >
                    <Card className="flex flex-col items-center justify-center h-full min-h-[160px] border-dashed cursor-pointer transition-all hover:border-primary hover:bg-muted/50">
                      <Plus className="h-8 w-8 text-muted-foreground mb-2" />
                      <p className="font-medium">Criar novo quadro</p>
                      <p className="text-sm text-muted-foreground">
                        Comece um novo projeto do zero
                      </p>
                    </Card>
                  </CreateBoardDialog>
                </div>
              )}

              {renderPagination()}
            </div>

            {/* Archived Boards */}
            {archivedBoards.length > 0 && (
              <Collapsible open={archivedOpen} onOpenChange={setArchivedOpen} className="mt-8">
                <CollapsibleTrigger asChild>
                  <Button
                    variant="ghost"
                    className="w-full flex items-center justify-between p-0 h-auto hover:bg-transparent"
                  >
                    <div className="flex items-center gap-2">
                      <Archive className="h-5 w-5 text-muted-foreground" />
                      <span className="font-semibold text-muted-foreground">
                        Quadros arquivados ({archivedBoards.length})
                      </span>
                    </div>
                    {archivedOpen ? (
                      <ChevronUp className="h-4 w-4" />
                    ) : (
                      <ChevronDown className="h-4 w-4" />
                    )}
                  </Button>
                </CollapsibleTrigger>
                <CollapsibleContent className="mt-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {archivedBoards.map((board) => renderBoardCard(board, true))}
                  </div>
                </CollapsibleContent>
              </Collapsible>
            )}
          </>
        )}
      </div>
    </div>
  );

  const renderEditView = () => {
    if (!editingBoard) return null;

    return (
      <div className="p-4 min-w-0">
        <BoardEditForm
          board={editingBoard}
          onBack={handleBackToList}
          onSuccess={handleBackToList}
        />
      </div>
    );
  };

  const title = viewMode === 'edit' ? 'Editar Quadro' : 'Gestão de quadros';
  const description =
    viewMode === 'edit'
      ? 'Edite as informações do quadro.'
      : 'Gerencie e crie novos quadros para organizar seus projetos.';

  return (
    <>
      <ResponsiveDrawer
        open={open}
        onOpenChange={onOpenChange}
        title={title}
        description={description}
        className="max-w-[800px]"
      >
        {viewMode === 'list' ? renderListView() : renderEditView()}
      </ResponsiveDrawer>

      {/* Delete Confirmation Dialog */}
      <DialogAction
        open={deleteDisclosure.isOpen}
        title="Excluir quadro"
        subtitle={`Tem certeza que deseja excluir o quadro "${deleteDisclosure.state?.title}"? Esta ação não pode ser desfeita e todos os cards serão perdidos.`}
        onRefuse={() => deleteDisclosure.close()}
        disabled={deleteBoardMutation.isPending}
        confirmButton={
          <Button
            variant="destructive"
            onClick={handleDeleteBoard}
            disabled={deleteBoardMutation.isPending}
          >
            {deleteBoardMutation.isPending ? 'Excluindo...' : 'Excluir'}
          </Button>
        }
      />

      {/* Archive Confirmation Dialog */}
      <DialogAction
        open={archiveDisclosure.isOpen}
        title="Arquivar quadro"
        subtitle={`Tem certeza que deseja arquivar o quadro "${archiveDisclosure.state?.title}"? Você poderá restaurá-lo posteriormente.`}
        onRefuse={() => archiveDisclosure.close()}
        disabled={updateBoardMutation.isPending}
        confirmButton={
          <Button onClick={handleArchiveBoard} disabled={updateBoardMutation.isPending}>
            {updateBoardMutation.isPending ? 'Arquivando...' : 'Arquivar'}
          </Button>
        }
      />
    </>
  );
}
