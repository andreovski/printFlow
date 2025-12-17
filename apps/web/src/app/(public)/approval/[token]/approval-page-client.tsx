'use client';

import {
  AlertTriangle,
  Building2,
  Calendar,
  Check,
  CheckCircle2,
  FileText,
  Info,
  Loader2,
  Mail,
  Phone,
  X,
  XCircle,
} from 'lucide-react';
import * as React from 'react';
import { toast } from 'sonner';

import {
  approvePublicBudget,
  getPublicBudget,
  rejectPublicBudget,
} from '@/app/http/requests/public-budgets';
import { ResponsiveDrawer } from '@/components/responsive-drawer';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import { Textarea } from '@/components/ui/textarea';

interface ApprovalPageClientProps {
  token: string;
}

interface BudgetData {
  id: string;
  code: number;
  status: string;
  expirationDate: string | null;
  total: number;
  subtotal: number;
  discountType: string | null;
  discountValue: number | null;
  advancePayment: number | null;
  paymentType: string | null;
  notes: string | null;
  publicApprovedRejectedAt: string | null;
  rejectionReason: string | null;
  items: Array<{
    id: string;
    name: string;
    quantity: number;
    salePrice: number;
    width: number | null;
    height: number | null;
    unitType: 'M2' | 'UNIDADE' | null;
    discountType: string | null;
    discountValue: number | null;
    total: number;
  }>;
  client: {
    name: string;
  };
  organization: {
    name: string;
    fantasyName: string | null;
    mainPhone: string | null;
    mainEmail: string | null;
  };
}

const currencyFormatter = new Intl.NumberFormat('pt-BR', {
  style: 'currency',
  currency: 'BRL',
});

const dateFormatter = new Intl.DateTimeFormat('pt-BR', {
  day: '2-digit',
  month: '2-digit',
  year: 'numeric',
});

const paymentTypeLabels: Record<string, string> = {
  PIX: 'Pix',
  CREDIT_CARD: 'Cartão de Crédito',
  DEBIT_CARD: 'Cartão de Débito',
  BOLETO: 'Boleto',
  CASH: 'Dinheiro',
  TRANSFER: 'Transferência',
};

export function ApprovalPageClient({ token }: ApprovalPageClientProps) {
  const [budget, setBudget] = React.useState<BudgetData | null>(null);
  const [isExpired, setIsExpired] = React.useState(false);
  const [isLoading, setIsLoading] = React.useState(true);
  const [error, setError] = React.useState<string | null>(null);
  const [isProcessing, setIsProcessing] = React.useState(false);
  const [showApproveDialog, setShowApproveDialog] = React.useState(false);
  const [showRejectDialog, setShowRejectDialog] = React.useState(false);
  const [rejectionReason, setRejectionReason] = React.useState('');

  React.useEffect(() => {
    async function loadBudget() {
      try {
        setIsLoading(true);
        const response = await getPublicBudget(token);
        setBudget(response.budget as unknown as BudgetData);
        setIsExpired(response.isExpired);
      } catch (err: any) {
        const errorMessage =
          err?.response?.status === 404
            ? 'Orçamento não encontrado ou link inválido'
            : err?.response?.status === 400
              ? 'Este orçamento já foi processado'
              : 'Erro ao carregar orçamento';
        setError(errorMessage);
      } finally {
        setIsLoading(false);
      }
    }

    loadBudget();
  }, [token]);

  const handleApprove = async () => {
    try {
      setIsProcessing(true);
      await approvePublicBudget(token);
      setShowApproveDialog(false);
      toast.success('Orçamento aprovado com sucesso!');
      // Recarregar o orçamento para atualizar o status
      const response = await getPublicBudget(token);
      setBudget(response.budget as unknown as BudgetData);
      setIsExpired(response.isExpired);
    } catch (_err) {
      toast.error('Erro ao aprovar orçamento');
    } finally {
      setIsProcessing(false);
    }
  };

  const handleReject = async () => {
    try {
      setIsProcessing(true);
      await rejectPublicBudget(token, rejectionReason || undefined);
      setShowRejectDialog(false);
      toast.success('Orçamento recusado');
      // Recarregar o orçamento para atualizar o status
      const response = await getPublicBudget(token);
      setBudget(response.budget as unknown as BudgetData);
      setIsExpired(response.isExpired);
    } catch (_err) {
      toast.error('Erro ao recusar orçamento');
    } finally {
      setIsProcessing(false);
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="flex flex-col items-center gap-4">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
          <p className="text-muted-foreground">Carregando orçamento...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background p-4">
        <Card className="w-full max-w-md">
          <CardContent className="pt-6">
            <div className="flex flex-col items-center gap-4 text-center">
              <XCircle className="h-12 w-12 text-destructive" />
              <h2 className="text-xl font-semibold">Erro</h2>
              <p className="text-muted-foreground">{error}</p>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (!budget) return null;

  return (
    <div className="min-h-screen bg-background py-8 px-4">
      <div className="max-w-3xl mx-auto space-y-6">
        {/* Header */}
        <Card>
          <CardHeader className="text-center">
            <div className="flex items-center justify-center gap-2 mb-2">
              <Building2 className="h-6 w-6 text-primary" />
              <CardTitle className="text-xl">
                {budget.organization.fantasyName || budget.organization.name}
              </CardTitle>
            </div>
            <CardDescription>Orçamento #{budget.code}</CardDescription>
            <div className="flex justify-center gap-4 text-sm text-muted-foreground mt-2">
              {budget.organization.mainPhone && (
                <span className="flex items-center gap-1">
                  <Phone className="h-4 w-4" />
                  {budget.organization.mainPhone}
                </span>
              )}
              {budget.organization.mainEmail && (
                <span className="flex items-center gap-1">
                  <Mail className="h-4 w-4" />
                  {budget.organization.mainEmail}
                </span>
              )}
            </div>
          </CardHeader>
        </Card>

        {/* Status Banner - Approved */}
        {budget.status === 'ACCEPTED' && (
          <Card className="border-green-500 bg-green-50">
            <CardContent className="pt-4">
              <div className="flex items-center gap-3 text-green-700">
                <CheckCircle2 className="h-5 w-5 shrink-0" />
                <div>
                  <p className="font-medium">Orçamento aprovado</p>
                  <p className="text-sm">
                    Este orçamento foi aprovado
                    {budget.publicApprovedRejectedAt &&
                      ` em ${dateFormatter.format(new Date(budget.publicApprovedRejectedAt))}`}
                    . A empresa entrará em contato em breve para dar continuidade.
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Status Banner - Rejected */}
        {budget.status === 'REJECTED' && (
          <Card className="border-red-500 bg-red-50">
            <CardContent className="pt-4">
              <div className="flex items-center gap-3 text-red-700">
                <XCircle className="h-5 w-5 shrink-0" />
                <div>
                  <p className="font-medium">Orçamento recusado</p>
                  <p className="text-sm">
                    Este orçamento foi recusado
                    {budget.publicApprovedRejectedAt &&
                      ` em ${dateFormatter.format(new Date(budget.publicApprovedRejectedAt))}`}
                    .
                    {budget.rejectionReason && (
                      <>
                        <br />
                        <strong>Motivo:</strong> {budget.rejectionReason}
                      </>
                    )}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Status Banner - Other Status */}
        {budget.status !== 'SENT' &&
          budget.status !== 'ACCEPTED' &&
          budget.status !== 'REJECTED' && (
            <Card className="border-blue-500 bg-blue-50">
              <CardContent className="pt-4">
                <div className="flex items-center gap-3 text-blue-700">
                  <Info className="h-5 w-5 shrink-0" />
                  <div>
                    <p className="font-medium">Visualização do orçamento</p>
                    <p className="text-sm">
                      Este orçamento não está mais disponível para aprovação ou recusa.
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}

        {/* Expired Warning */}
        {isExpired && budget.status === 'SENT' && (
          <Card className="border-yellow-500 bg-yellow-50">
            <CardContent className="pt-4">
              <div className="flex items-center gap-3 text-yellow-700">
                <AlertTriangle className="h-5 w-5 shrink-0" />
                <div>
                  <p className="font-medium">Orçamento expirado</p>
                  <p className="text-sm">
                    Este orçamento expirou em{' '}
                    {budget.expirationDate && dateFormatter.format(new Date(budget.expirationDate))}
                    . Você ainda pode visualizá-lo, mas não é possível aprovar ou recusar.
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Client Info */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Olá, {budget.client.name}!</CardTitle>
            <CardDescription>
              {budget.status === 'SENT'
                ? 'Você recebeu um orçamento. Revise os detalhes abaixo e aprove ou recuse.'
                : 'Detalhes do orçamento abaixo.'}
            </CardDescription>
          </CardHeader>
        </Card>

        {/* Budget Details */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base flex items-center gap-2">
              <FileText className="h-4 w-4" />
              Itens do Orçamento
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {budget.items.map((item) => (
                <div
                  key={item.id}
                  className="flex justify-between items-start py-2 border-b last:border-0"
                >
                  <div className="flex-1">
                    <p className="font-medium">
                      {item.name}
                      {item.unitType === 'M2' && item.width && item.height && (
                        <span className="text-xs text-muted-foreground ml-1">
                          ({item.width}m x {item.height}m)
                        </span>
                      )}
                    </p>
                    <p className="text-sm text-muted-foreground">
                      {item.quantity}x {currencyFormatter.format(Number(item.salePrice))}
                      {item.discountValue &&
                        Number(item.discountValue) > 0 &&
                        item.discountType === 'PERCENT' && (
                          <span className="ml-1 text-green-600">(-{item.discountValue}%)</span>
                        )}
                      {item.discountValue &&
                        Number(item.discountValue) > 0 &&
                        item.discountType === 'VALUE' && (
                          <span className="ml-1 text-green-600">
                            (-{currencyFormatter.format(Number(item.discountValue))})
                          </span>
                        )}
                    </p>
                  </div>
                  <p className="font-medium">{currencyFormatter.format(Number(item.total))}</p>
                </div>
              ))}
            </div>

            <Separator className="my-4" />

            {/* Totals */}
            <div className="space-y-2">
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">Subtotal</span>
                <span>{currencyFormatter.format(Number(budget.subtotal))}</span>
              </div>

              {budget.discountValue && Number(budget.discountValue) > 0 && (
                <div className="flex justify-between text-sm text-green-600">
                  <span>
                    Desconto {budget.discountType === 'PERCENT' && `(${budget.discountValue}%)`}
                  </span>
                  <span>
                    -{' '}
                    {budget.discountType === 'VALUE'
                      ? currencyFormatter.format(Number(budget.discountValue))
                      : currencyFormatter.format(
                          Number(budget.subtotal) * (Number(budget.discountValue) / 100)
                        )}
                  </span>
                </div>
              )}

              {budget.advancePayment && Number(budget.advancePayment) > 0 && (
                <div className="flex justify-between text-sm text-blue-600">
                  <span>Entrada/Sinal</span>
                  <span>- {currencyFormatter.format(Number(budget.advancePayment))}</span>
                </div>
              )}

              <Separator />

              <div className="flex justify-between text-lg font-bold">
                <span>Total</span>
                <span className="text-primary">
                  {currencyFormatter.format(Number(budget.total))}
                </span>
              </div>

              {budget.paymentType && (
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Forma de Pagamento</span>
                  <span>{paymentTypeLabels[budget.paymentType] || budget.paymentType}</span>
                </div>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Notes */}
        {budget.notes && (
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Observações</CardTitle>
            </CardHeader>
            <CardContent>
              <div
                className="text-sm text-muted-foreground prose prose-sm max-w-none"
                dangerouslySetInnerHTML={{ __html: budget.notes }}
              />
            </CardContent>
          </Card>
        )}

        {/* Expiration */}
        {budget.expirationDate && (
          <Card>
            <CardContent className="pt-4">
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <Calendar className="h-4 w-4" />
                <span>Válido até: {dateFormatter.format(new Date(budget.expirationDate))}</span>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Informational Warning */}
        <Card className="">
          <CardContent className="pt-4">
            <div className="flex items-center gap-3 text-blue-700">
              <Info className="h-5 w-5 shrink-0" />
              <div>
                <p className="font-medium">Aviso</p>
                <p className="text-sm">
                  Esta é a etapa de aceite do orçamento. O pagamento só será solicitado diretamente
                  pela empresa.
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Action Buttons - Only show for SENT status and not expired */}
        {!isExpired && budget.status === 'SENT' && (
          <div className="flex flex-col sm:flex-row gap-3">
            <Button
              size="lg"
              className="flex-1 bg-green-600 hover:bg-green-700 p-2"
              onClick={() => setShowApproveDialog(true)}
            >
              <Check className="h-5 w-5 mr-2" />
              Aprovar Orçamento
            </Button>
            <Button
              size="lg"
              variant="destructive"
              className="flex-1"
              onClick={() => setShowRejectDialog(true)}
            >
              <X className="h-5 w-5 mr-2" />
              Recusar Orçamento
            </Button>
          </div>
        )}
      </div>

      {/* Approve Dialog */}
      <ResponsiveDrawer
        title="Confirmar Aprovação"
        description={
          <span>
            Você está prestes a aprovar o orçamento #{budget.code} no valor de{' '}
            {currencyFormatter.format(Number(budget.total))}. Deseja continuar?
          </span>
        }
        open={showApproveDialog}
        onOpenChange={setShowApproveDialog}
        className="max-w-md"
      >
        <div className="p-4 flex flex-col sm:flex-row gap-3">
          <Button
            variant="outline"
            onClick={() => setShowApproveDialog(false)}
            disabled={isProcessing}
            className="flex-1"
          >
            Cancelar
          </Button>
          <Button
            onClick={handleApprove}
            disabled={isProcessing}
            className="flex-1 bg-green-600 hover:bg-green-700"
          >
            {isProcessing ? (
              <>
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                Aprovando...
              </>
            ) : (
              'Confirmar Aprovação'
            )}
          </Button>
        </div>
      </ResponsiveDrawer>

      {/* Reject Dialog */}
      <ResponsiveDrawer
        title="Recusar Orçamento"
        description={
          <span>
            Você está prestes a recusar o orçamento #{budget.code}. Se desejar, informe o motivo
            abaixo (opcional).
          </span>
        }
        open={showRejectDialog}
        onOpenChange={setShowRejectDialog}
        className="max-w-md"
      >
        <div className="p-4 space-y-4">
          <Textarea
            placeholder="Motivo da recusa (opcional)"
            value={rejectionReason}
            onChange={(e) => setRejectionReason(e.target.value)}
            rows={3}
          />
          <div className="flex flex-col sm:flex-row gap-3">
            <Button
              variant="outline"
              onClick={() => setShowRejectDialog(false)}
              disabled={isProcessing}
              className="flex-1"
            >
              Cancelar
            </Button>
            <Button
              onClick={handleReject}
              disabled={isProcessing}
              className="flex-1 bg-red-600 hover:bg-red-700"
            >
              {isProcessing ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Recusando...
                </>
              ) : (
                'Confirmar Recusa'
              )}
            </Button>
          </div>
        </div>
      </ResponsiveDrawer>
    </div>
  );
}
