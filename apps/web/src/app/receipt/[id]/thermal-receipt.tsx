'use client';

import { Budget, type Organization, paymentTypeLabel } from '@magic-system/schemas';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { forwardRef } from 'react';

import { useAppContext } from '@/hooks/use-app-context';

interface ThermalReceiptProps {
  budget: Budget;
  organization?: Organization;
  hideValues?: boolean;
}

const formatCurrency = (value: number | null | undefined): string => {
  return new Intl.NumberFormat('pt-BR', {
    style: 'currency',
    currency: 'BRL',
  }).format(Number(value ?? 0));
};

const formatDocument = (document: string, personType: string): string => {
  if (personType === 'JURIDICA') {
    return document.replace(/^(\d{2})(\d{3})(\d{3})(\d{4})(\d{2})$/, '$1.$2.$3/$4-$5');
  }
  return document.replace(/^(\d{3})(\d{3})(\d{3})(\d{2})$/, '$1.$2.$3-$4');
};

export const ThermalReceipt = forwardRef<HTMLDivElement, ThermalReceiptProps>(
  ({ budget, hideValues, organization: propOrganization }, ref) => {
    const context = useAppContext();
    const organization = propOrganization || context.organization;

    const client = budget.client;

    // Build organization address
    const orgAddress = [
      organization?.address,
      organization?.addressNumber,
      organization?.neighborhood,
    ];

    // Calculate balance due
    const advancePayment = Number(budget.advancePayment ?? 0);
    const total = Number(budget.total);
    const balanceDue = total;

    const divider = '--------------------------------';

    return (
      <div
        ref={ref}
        className="bg-white text-black w-[50mm] mx-auto font-mono text-[8px] leading-tight p-1 print:p-0 print:shadow-none"
        style={{ fontFamily: 'monospace' }}
      >
        {/* Header - Company Info */}
        <div className="text-center mb-2">
          {organization?.logoUrl && (
            <div className="flex justify-center mb-1">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={organization.logoUrl}
                alt="Logo"
                className="w-16 h-16 object-contain grayscale"
              />
            </div>
          )}
          <p className="font-bold text-[10px] uppercase">
            {organization?.fantasyName || organization?.enterpriseName || organization?.name}
          </p>
          {organization?.cnpj && (
            <p>
              CNPJ:{' '}
              {organization.cnpj.replace(/^(\d{2})(\d{3})(\d{3})(\d{4})(\d{2})$/, '$1.$2.$3/$4-$5')}
            </p>
          )}
          {orgAddress && <p className="break-words">{orgAddress}</p>}
          {organization?.mainPhone && <p>Tel: {organization.mainPhone}</p>}
        </div>

        <p className="text-center">{divider}</p>

        {/* Receipt Title */}
        <div className="text-center my-1">
          <p className="font-bold text-[10px]">RECIBO DE VENDA</p>
          <p className="font-bold">Nº {budget.code}</p>
          <p>{format(new Date(), 'dd/MM/yyyy HH:mm', { locale: ptBR })}</p>
        </div>

        <p className="text-center">{divider}</p>

        {/* Client Info */}
        <div className="my-1">
          <p className="font-bold">CLIENTE:</p>
          <p className="break-words">{client.name}</p>
          <p>
            {client.personType === 'JURIDICA' ? 'CNPJ' : 'CPF'}:{' '}
            {formatDocument(client.document, client.personType)}
          </p>
          {client.phone && <p>Tel: {client.phone}</p>}
        </div>

        <p className="text-center">{divider}</p>

        {/* Items */}
        <div className="my-1">
          <p className="font-bold">ITENS:</p>
          {budget.items.map((item, index) => {
            const itemSubtotal = Number(item.salePrice) * item.quantity;
            let itemDiscount = 0;
            if (item.discountType === 'PERCENT' && item.discountValue) {
              itemDiscount = itemSubtotal * (Number(item.discountValue) / 100);
            } else if (item.discountType === 'VALUE' && item.discountValue) {
              itemDiscount = Number(item.discountValue);
            }

            return (
              <div key={item.id} className="mb-1">
                <p className="break-words">
                  {index + 1}. {item.name}
                  {item.unitType === 'M2' && item.width && item.height && (
                    <span className="text-[7px]">
                      {' '}
                      ({item.width}m x {item.height}m)
                    </span>
                  )}
                </p>
                <div className="flex justify-between">
                  {hideValues ? (
                    <span>Qtd: {item.quantity}</span>
                  ) : (
                    <>
                      <span>
                        {item.quantity}x {formatCurrency(item.salePrice)}
                      </span>
                      <span>{formatCurrency(item.total)}</span>
                    </>
                  )}
                </div>
                {!hideValues && itemDiscount > 0 && (
                  <p className="text-right">Desc: -{formatCurrency(itemDiscount)}</p>
                )}
              </div>
            );
          })}
        </div>

        <p className="text-center">{divider}</p>

        {/* Totals */}
        {!hideValues && (
          <div className="my-1">
            {budget.discountValue && Number(budget.discountValue) > 0 && (
              <div className="flex justify-between">
                <span>
                  Desconto{budget.discountType === 'PERCENT' ? ` (${budget.discountValue}%)` : ''}:
                </span>
                <span>
                  -
                  {budget.discountType === 'PERCENT'
                    ? formatCurrency((Number(budget.subtotal) * Number(budget.discountValue)) / 100)
                    : formatCurrency(budget.discountValue)}
                </span>
              </div>
            )}

            {budget.surchargeValue && Number(budget.surchargeValue) > 0 && (
              <div className="flex justify-between">
                <span>
                  Acrésc.{budget.surchargeType === 'PERCENT' ? ` (${budget.surchargeValue}%)` : ''}:
                </span>
                <span>
                  +
                  {budget.surchargeType === 'PERCENT'
                    ? formatCurrency(
                        (Number(budget.subtotal) * Number(budget.surchargeValue)) / 100
                      )
                    : formatCurrency(budget.surchargeValue)}
                </span>
              </div>
            )}

            <div className="flex justify-between font-bold text-[10px] mt-1 border-t border-dashed border-black pt-1">
              <span>TOTAL:</span>
              <span>{formatCurrency(total)}</span>
            </div>
          </div>
        )}

        <p className="text-center">{divider}</p>

        {/* Payment Info */}
        {!hideValues && (
          <div className="my-1">
            <p className="font-bold">PAGAMENTO:</p>
            <div className="flex justify-between">
              <span>Forma:</span>
              <span>{budget.paymentType ? paymentTypeLabel[budget.paymentType] : '-'}</span>
            </div>
            {advancePayment > 0 && (
              <div className="flex justify-between">
                <span>Entrada:</span>
                <span>{formatCurrency(advancePayment)}</span>
              </div>
            )}
            {budget.isPaidInFull && (
              <div className="flex justify-between ">
                <span className="font-semibold">Valor Pago:</span>
                <span>{formatCurrency(budget.subtotal - advancePayment)}</span>
              </div>
            )}
            <div className="flex justify-between font-bold">
              <span>Saldo:</span>
              <span>{formatCurrency(balanceDue)}</span>
            </div>
          </div>
        )}

        {/* Notes */}
        {budget.notes && (
          <>
            <p className="text-center">{divider}</p>
            <div className="my-1">
              <p className="font-bold">OBS:</p>
              <div
                className="break-words text-[7px]"
                dangerouslySetInnerHTML={{ __html: budget.notes }}
              />
            </div>
          </>
        )}

        <p className="text-center">{divider}</p>

        {/* Footer */}
        <div className="text-center mt-2 text-[7px]">
          <p>Este documento não possui</p>
          <p>valor fiscal.</p>
          <p className="mt-2">{format(new Date(), "dd/MM/yyyy 'às' HH:mm", { locale: ptBR })}</p>
        </div>

        {/* Extra space for cutting */}
        <div className="h-4"></div>
      </div>
    );
  }
);

ThermalReceipt.displayName = 'ThermalReceipt';
