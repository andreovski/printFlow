'use client';

import { Check, Copy, Link2, Loader2 } from 'lucide-react';
import * as React from 'react';
import { toast } from 'sonner';

import { generateApprovalLink } from '@/app/http/requests/budgets';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';

interface GenerateLinkButtonProps {
  budgetId: string;
  existingToken?: string | null;
  expirationDate?: Date | null;
}

const dateFormatter = new Intl.DateTimeFormat('pt-BR', {
  day: '2-digit',
  month: '2-digit',
  year: 'numeric',
});

export function GenerateLinkButton({
  budgetId,
  existingToken,
  expirationDate,
}: GenerateLinkButtonProps) {
  const [isOpen, setIsOpen] = React.useState(false);
  const [isGenerating, setIsGenerating] = React.useState(false);
  const [approvalUrl, setApprovalUrl] = React.useState<string | null>(null);
  const [expiresAt, setExpiresAt] = React.useState<Date | null>(expirationDate || null);
  const [copied, setCopied] = React.useState(false);

  // If there's an existing token, build the URL
  React.useEffect(() => {
    if (existingToken) {
      const frontendUrl = window.location.origin;
      setApprovalUrl(`${frontendUrl}/approval/${existingToken}`);
    }
  }, [existingToken]);

  const handleGenerateLink = async () => {
    try {
      setIsGenerating(true);
      const response = await generateApprovalLink(budgetId);
      // Use the short URL for better sharing experience
      setApprovalUrl(response.shortUrl);
      setExpiresAt(response.expiresAt ? new Date(response.expiresAt) : null);
      toast.success('Link de aprovação gerado com sucesso!');
    } catch (_err) {
      toast.error('Erro ao gerar link de aprovação');
    } finally {
      setIsGenerating(false);
    }
  };

  const handleCopyLink = async () => {
    if (!approvalUrl) return;

    try {
      await navigator.clipboard.writeText(approvalUrl);
      setCopied(true);
      toast.success('Link copiado para a área de transferência!');
      setTimeout(() => setCopied(false), 2000);
    } catch (_err) {
      toast.error('Erro ao copiar link');
    }
  };

  const handleOpenDialog = () => {
    setIsOpen(true);
    // If no existing link, generate one automatically
    if (!approvalUrl && !existingToken) {
      handleGenerateLink();
    }
  };

  return (
    <>
      <Button
        variant="outline"
        type="button"
        onClick={handleOpenDialog}
        title="Gerar link de aprovação"
      >
        <Link2 className="h-4 w-4" />
      </Button>

      <Dialog open={isOpen} onOpenChange={setIsOpen}>
        <DialogContent className="sm:max-w-md gap-2">
          <DialogHeader className="m-0 p-0 border-none">
            <DialogTitle>Link de Aprovação</DialogTitle>
            <DialogDescription>
              Compartilhe este link com o cliente para que ele possa aprovar ou recusar o orçamento
              diretamente.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-4">
            {isGenerating ? (
              <div className="flex items-center justify-center py-8">
                <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
              </div>
            ) : approvalUrl ? (
              <>
                <div className="space-y-2">
                  <Label>Link para o cliente</Label>
                  <div className="flex gap-2">
                    <Input value={approvalUrl} readOnly className="text-sm" />
                    <Button
                      type="button"
                      variant="outline"
                      size="icon"
                      onClick={handleCopyLink}
                      className="shrink-0"
                    >
                      {copied ? (
                        <Check className="h-4 w-4 text-green-500" />
                      ) : (
                        <Copy className="h-4 w-4" />
                      )}
                    </Button>
                  </div>
                </div>

                {expiresAt && (
                  <p className="text-sm text-muted-foreground">
                    Este link é válido até: {dateFormatter.format(expiresAt)}
                  </p>
                )}

                <div className="flex gap-2 pt-2">
                  <Button
                    type="button"
                    variant="outline"
                    onClick={handleGenerateLink}
                    disabled={isGenerating}
                    className="flex-1"
                  >
                    {isGenerating ? (
                      <>
                        <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                        Gerando...
                      </>
                    ) : (
                      'Gerar novo link'
                    )}
                  </Button>
                  <Button type="button" onClick={handleCopyLink} className="flex-1">
                    <Copy className="h-4 w-4 mr-2" />
                    Copiar link
                  </Button>
                </div>
              </>
            ) : (
              <div className="text-center py-4">
                <p className="text-muted-foreground mb-4">
                  Clique abaixo para gerar um link de aprovação para este orçamento.
                </p>
                <Button type="button" onClick={handleGenerateLink} disabled={isGenerating}>
                  {isGenerating ? (
                    <>
                      <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                      Gerando...
                    </>
                  ) : (
                    <>
                      <Link2 className="h-4 w-4 mr-2" />
                      Gerar Link
                    </>
                  )}
                </Button>
              </div>
            )}
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}
