'use client';

import { FileIcon, ImageIcon, Loader2, Paperclip, Trash2, X } from 'lucide-react';
import Image from 'next/image';
import * as React from 'react';
import { toast } from 'sonner';

import { api } from '@/app/http/api';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { useUploadThing } from '@/lib/uploadthing-components';
import { cn } from '@/lib/utils';

export interface Attachment {
  id: string;
  name: string;
  url: string;
  key: string;
  size: number;
  mimeType?: string | null;
  createdAt?: string;
}

interface AttachmentsManagerProps {
  entityType: 'budget' | 'card';
  entityId: string;
  attachments: Attachment[];
  onAttachmentsChange: (attachments: Attachment[]) => void;
  disabled?: boolean;
  maxFiles?: number;
  className?: string;
}

function formatFileSize(bytes: number): string {
  if (bytes === 0) return '0 Bytes';
  const k = 1024;
  const sizes = ['Bytes', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
}

function isImageFile(mimeType?: string | null): boolean {
  return mimeType?.startsWith('image/') ?? false;
}

function getFileIcon(mimeType?: string | null) {
  if (isImageFile(mimeType)) {
    return <ImageIcon className="h-4 w-4" />;
  }
  return <FileIcon className="h-4 w-4" />;
}

export function AttachmentsManager({
  entityType,
  entityId,
  attachments,
  onAttachmentsChange,
  disabled = false,
  maxFiles = 10,
  className,
}: AttachmentsManagerProps) {
  const [isUploading, setIsUploading] = React.useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = React.useState(false);
  const [attachmentToDelete, setAttachmentToDelete] = React.useState<Attachment | null>(null);
  const [isDeleting, setIsDeleting] = React.useState(false);
  const [previewImage, setPreviewImage] = React.useState<string | null>(null);

  const endpoint = entityType === 'budget' ? 'budgetAttachment' : 'cardAttachment';

  const { startUpload, isUploading: uploadThingUploading } = useUploadThing(endpoint, {
    onClientUploadComplete: async (res) => {
      if (!res || res.length === 0) return;

      // Preparar dados para salvar no backend
      const newAttachments = res.map((file) => ({
        name: file.name,
        url: file.ufsUrl,
        key: file.key,
        size: file.size,
        mimeType: file.type,
      }));

      try {
        // Salvar referências no backend
        const apiEndpoint =
          entityType === 'budget'
            ? `budgets/${entityId}/attachments`
            : `cards/${entityId}/attachments`;

        await api.post(apiEndpoint, {
          json: { attachments: newAttachments },
        });

        // Recarregar lista de attachments
        await fetchAttachments();

        toast.success(
          `${res.length} ${res.length === 1 ? 'arquivo enviado' : 'arquivos enviados'} com sucesso!`
        );
      } catch (error) {
        console.error('Error saving attachments:', error);
        toast.error('Erro ao salvar anexos');
      } finally {
        setIsUploading(false);
      }
    },
    onUploadError: (error) => {
      console.error('Upload error:', error);
      toast.error(error.message || 'Erro ao fazer upload');
      setIsUploading(false);
    },
    onUploadBegin: () => {
      setIsUploading(true);
    },
  });

  const fetchAttachments = React.useCallback(async () => {
    try {
      const apiEndpoint =
        entityType === 'budget'
          ? `budgets/${entityId}/attachments`
          : `cards/${entityId}/attachments`;

      const response = await api.get(apiEndpoint).json<{ attachments: Attachment[] }>();
      onAttachmentsChange(response.attachments);
    } catch (error) {
      console.error('Error fetching attachments:', error);
    }
  }, [entityType, entityId, onAttachmentsChange]);

  // Buscar attachments ao montar o componente
  React.useEffect(() => {
    if (entityId) {
      fetchAttachments();
    }
  }, [entityId, fetchAttachments]);

  const handleFileSelect = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = event.target.files;
    if (!files || files.length === 0) return;

    const remainingSlots = maxFiles - attachments.length;
    if (files.length > remainingSlots) {
      toast.error(`Você pode adicionar no máximo ${remainingSlots} arquivo(s)`);
      return;
    }

    await startUpload(Array.from(files));

    // Limpar input
    event.target.value = '';
  };

  const handleDeleteClick = (attachment: Attachment) => {
    setAttachmentToDelete(attachment);
    setDeleteDialogOpen(true);
  };

  const handleConfirmDelete = async () => {
    if (!attachmentToDelete) return;

    setIsDeleting(true);
    try {
      // 1. Deletar do UploadThing primeiro
      await fetch('/api/uploadthing/delete', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ fileKey: attachmentToDelete.key }),
      });

      // 2. Deletar referência do backend
      const apiEndpoint =
        entityType === 'budget'
          ? `budgets/${entityId}/attachments/${attachmentToDelete.id}`
          : `cards/${entityId}/attachments/${attachmentToDelete.id}`;

      await api.delete(apiEndpoint);

      // Remover da lista local
      onAttachmentsChange(attachments.filter((a) => a.id !== attachmentToDelete.id));
      toast.success('Anexo removido com sucesso');
    } catch (error) {
      console.error('Error deleting attachment:', error);
      toast.error('Erro ao remover anexo');
    } finally {
      setIsDeleting(false);
      setDeleteDialogOpen(false);
      setAttachmentToDelete(null);
    }
  };

  const isLoading = isUploading || uploadThingUploading;
  const canAddMore = attachments.length < maxFiles;
  const inputRef = React.useRef<HTMLInputElement>(null);

  const handleButtonClick = () => {
    if (!disabled && !isLoading && canAddMore) {
      inputRef.current?.click();
    }
  };

  return (
    <div className={cn('space-y-4', className)}>
      {/* Upload button */}
      <div className="flex items-center gap-2">
        <Button
          type="button"
          variant="outline"
          size="sm"
          disabled={disabled || isLoading || !canAddMore}
          onClick={handleButtonClick}
        >
          {isLoading ? (
            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
          ) : (
            <Paperclip className="mr-2 h-4 w-4" />
          )}
          {isLoading ? 'Enviando...' : 'Adicionar anexo'}
        </Button>
        <input
          ref={inputRef}
          type="file"
          className="hidden"
          onChange={handleFileSelect}
          disabled={disabled || isLoading || !canAddMore}
          multiple
          accept="image/*,.pdf,.doc,.docx,.xls,.xlsx"
        />
        <span className="text-xs text-muted-foreground">
          {attachments.length}/{maxFiles} arquivos
        </span>
      </div>

      {/* Lista de attachments */}
      {attachments.length > 0 && (
        <div className="space-y-2">
          {attachments.map((attachment) => (
            <div
              key={attachment.id}
              className="flex items-center gap-3 p-2 rounded-lg border bg-muted/30 hover:bg-muted/50 transition-colors group"
            >
              {/* Preview/Icon */}
              {isImageFile(attachment.mimeType) ? (
                <button
                  type="button"
                  className="relative h-10 w-10 rounded overflow-hidden flex-shrink-0 cursor-pointer hover:opacity-80 transition-opacity"
                  onClick={() => setPreviewImage(attachment.url)}
                >
                  <Image
                    src={attachment.url}
                    alt={attachment.name}
                    fill
                    className="object-cover"
                    sizes="40px"
                  />
                </button>
              ) : (
                <div className="h-10 w-10 rounded bg-muted flex items-center justify-center flex-shrink-0">
                  {getFileIcon(attachment.mimeType)}
                </div>
              )}

              {/* Info */}
              <div className="flex-1 min-w-0">
                <a
                  href={attachment.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-sm font-medium truncate block hover:underline"
                >
                  {attachment.name}
                </a>
                <p className="text-xs text-muted-foreground">{formatFileSize(attachment.size)}</p>
              </div>

              {/* Actions */}
              <Button
                type="button"
                variant="ghost"
                size="icon"
                className="h-8 w-8 opacity-0 group-hover:opacity-100 transition-opacity text-destructive hover:text-destructive"
                onClick={() => handleDeleteClick(attachment)}
                disabled={disabled}
              >
                <Trash2 className="h-4 w-4" />
              </Button>
            </div>
          ))}
        </div>
      )}

      {/* Delete confirmation dialog */}
      <Dialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Remover anexo</DialogTitle>
            <DialogDescription>
              Tem certeza que deseja remover o arquivo &ldquo;{attachmentToDelete?.name}&rdquo;?
              Esta ação não pode ser desfeita.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setDeleteDialogOpen(false)}
              disabled={isDeleting}
            >
              Cancelar
            </Button>
            <Button variant="destructive" onClick={handleConfirmDelete} disabled={isDeleting}>
              {isDeleting ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
              Remover
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Image preview dialog */}
      <Dialog open={!!previewImage} onOpenChange={() => setPreviewImage(null)}>
        <DialogContent className="max-w-4xl p-0 overflow-hidden">
          <button
            className="absolute right-4 top-4 z-10 rounded-full bg-background/80 p-2 hover:bg-background transition-colors"
            onClick={() => setPreviewImage(null)}
          >
            <X className="h-4 w-4" />
          </button>
          {previewImage && (
            <div className="relative w-full h-[80vh]">
              <Image
                src={previewImage}
                alt="Preview"
                fill
                className="object-contain"
                sizes="(max-width: 768px) 100vw, 80vw"
              />
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
