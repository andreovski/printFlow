'use client';

import { Budget, paymentTypeLabel } from '@magic-system/schemas';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { forwardRef } from 'react';

import { useAppContext } from '@/app/hooks/useAppContext';

interface SalesReceiptProps {
  budget: Budget;
  /** Reserved for future use - company logo URL */
  logoUrl?: string;
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

export const SalesReceipt = forwardRef<HTMLDivElement, SalesReceiptProps>(
  ({ budget, logoUrl }, ref) => {
    const { organization } = useAppContext();

    const client = budget.client;

    // Build organization address
    const orgAddress = [
      organization?.address,
      organization?.addressNumber,
      organization?.complement,
      organization?.neighborhood,
      organization?.city,
      organization?.state,
    ]
      .filter(Boolean)
      .join(', ');

    // Build client address
    const clientAddress = [
      client.address,
      client.addressNumber,
      client.complement,
      client.neighborhood,
      client.city,
      client.state,
    ]
      .filter(Boolean)
      .join(', ');

    // Calculate balance due
    const advancePayment = Number(budget.advancePayment ?? 0);
    const total = Number(budget.total);
    const balanceDue = total;

    return (
      <div
        ref={ref}
        className="bg-white text-black p-8 w-[210mm] min-h-[297mm] mx-auto font-sans text-sm print:p-4 print:shadow-none"
      >
        {/* Header - Company Info */}
        <div className="border-2 border-gray-800 p-4 mb-4">
          <div className="flex justify-between items-start">
            <div className="flex-1">
              {/* Logo placeholder for future use */}
              {logoUrl && (
                <div className="mb-2">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={logoUrl} alt="Logo" className="h-16 object-contain" />
                </div>
              )}
              <h1 className="text-2xl font-bold">
                {organization?.fantasyName || organization?.enterpriseName || organization?.name}
              </h1>
              {organization?.cnpj && (
                <p className="text-sm mt-1">
                  <span className="font-semibold">CNPJ:</span>{' '}
                  {organization.cnpj.replace(
                    /^(\d{2})(\d{3})(\d{3})(\d{4})(\d{2})$/,
                    '$1.$2.$3/$4-$5'
                  )}
                </p>
              )}
              {orgAddress && (
                <p className="text-sm">
                  <span className="font-semibold">Endereço:</span> {orgAddress}
                </p>
              )}
              {organization?.mainPhone && (
                <p className="text-sm">
                  <span className="font-semibold">Telefone:</span> {organization.mainPhone}
                </p>
              )}
              {organization?.mainEmail && (
                <p className="text-sm">
                  <span className="font-semibold">Email:</span> {organization.mainEmail}
                </p>
              )}
            </div>
            <div className="text-right">
              <h2 className="text-xl font-bold uppercase">Recibo de Venda</h2>
              <p className="text-lg font-semibold mt-2">Nº {budget.code}</p>
              <p className="text-sm mt-1">
                Data: {format(new Date(), 'dd/MM/yyyy', { locale: ptBR })}
              </p>
            </div>
          </div>
        </div>

        {/* Client Info */}
        <div className="border border-gray-400 p-3 mb-4">
          <h3 className="font-bold text-base mb-2 border-b border-gray-300 pb-1">
            DADOS DO CLIENTE
          </h3>
          <div className="grid grid-cols-2 gap-x-4 gap-y-1">
            <p>
              <span className="font-semibold">Nome:</span> {client.name}
            </p>
            <p>
              <span className="font-semibold">
                {client.personType === 'JURIDICA' ? 'CNPJ' : 'CPF'}:
              </span>{' '}
              {formatDocument(client.document, client.personType)}
            </p>
            <p>
              <span className="font-semibold">RG:</span> {client.rg || '-'}
            </p>
            <p>
              <span className="font-semibold">Telefone:</span> {client.phone}
            </p>
            <p className="col-span-2">
              <span className="font-semibold">Endereço:</span> {clientAddress}
            </p>
            {client.email && (
              <p className="col-span-2">
                <span className="font-semibold">Email:</span> {client.email}
              </p>
            )}
          </div>
        </div>

        {/* Seller/Attendant - Static */}
        <div className="border border-gray-400 p-2 mb-4">
          <span className="font-bold">Atendente/Vendedor: </span>
          <span>-</span>
        </div>

        {/* Items Table */}
        <div className="border border-gray-400 mb-4">
          <table className="w-full">
            <thead>
              <tr className="bg-gray-100 border-b border-gray-400">
                <th className="text-left p-2 border-r border-gray-400 w-12">#</th>
                <th className="text-left p-2 border-r border-gray-400">Descrição</th>
                <th className="text-center p-2 border-r border-gray-400 w-16">Qtd</th>
                <th className="text-right p-2 border-r border-gray-400 w-28">Vlr. Unit.</th>
                <th className="text-right p-2 border-r border-gray-400 w-24">Desc.</th>
                <th className="text-right p-2 w-28">Total</th>
              </tr>
            </thead>
            <tbody>
              {budget.items.map((item, index) => {
                const itemSubtotal = Number(item.salePrice) * item.quantity;
                let itemDiscount = 0;
                if (item.discountType === 'PERCENT' && item.discountValue) {
                  itemDiscount = itemSubtotal * (Number(item.discountValue) / 100);
                } else if (item.discountType === 'VALUE' && item.discountValue) {
                  itemDiscount = Number(item.discountValue);
                }

                return (
                  <tr key={item.id} className="border-b border-gray-300 last:border-b-0">
                    <td className="p-2 border-r border-gray-300 text-center">{index + 1}</td>
                    <td className="p-2 border-r border-gray-300">{item.name}</td>
                    <td className="p-2 border-r border-gray-300 text-center">{item.quantity}</td>
                    <td className="p-2 border-r border-gray-300 text-right">
                      {formatCurrency(item.salePrice)}
                    </td>
                    <td className="p-2 border-r border-gray-300 text-right">
                      {itemDiscount > 0 ? formatCurrency(itemDiscount) : '-'}
                    </td>
                    <td className="p-2 text-right">{formatCurrency(item.total)}</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>

        {/* Totals Block */}
        <div className="border border-gray-400 p-4 mb-4 bg-gray-50">
          <div className="flex justify-end mb-1">
            <span className="w-40">Subtotal:</span>
            <span className="w-32 text-right">{formatCurrency(budget.subtotal)}</span>
          </div>

          {budget.discountValue && Number(budget.discountValue) > 0 && (
            <div className="flex justify-end mb-1 text-red-600">
              <span className="w-40">
                Desconto
                {budget.discountType === 'PERCENT' ? ` (${budget.discountValue}%)` : ''}:
              </span>
              <span className="w-32 text-right">
                -{' '}
                {budget.discountType === 'PERCENT'
                  ? formatCurrency((Number(budget.subtotal) * Number(budget.discountValue)) / 100)
                  : formatCurrency(budget.discountValue)}
              </span>
            </div>
          )}

          <div className="flex justify-end mb-1">
            <span className="w-40">Valor do Frete:</span>
            <span className="w-32 text-right">R$ 0,00</span>
          </div>

          <div className="flex justify-end border-t border-gray-300 pt-2 mt-2 text-lg font-bold">
            <span className="w-40">TOTAL A PAGAR:</span>
            <span className="w-32 text-right">{formatCurrency(total)}</span>
          </div>
        </div>

        {/* Payment Info */}
        <div className="border border-gray-400 p-4 mb-4">
          <h3 className="font-bold text-base mb-2 border-b border-gray-300 pb-1">
            INFORMAÇÕES DE PAGAMENTO
          </h3>
          <div className="grid grid-cols-2 gap-4">
            <div className="flex justify-between">
              <span className="font-semibold">Forma de Pagamento:</span>
              <span>{budget.paymentType ? paymentTypeLabel[budget.paymentType] : '-'}</span>
            </div>
            <div className="flex justify-between">
              <span className="font-semibold">Entrada (Sinal):</span>
              <span>{formatCurrency(advancePayment)}</span>
            </div>
            <div className="flex justify-between text-lg font-bold">
              <span>Saldo Devedor:</span>
              <span>{formatCurrency(balanceDue)}</span>
            </div>
          </div>
        </div>

        {/* Notes */}
        {budget.notes && (
          <div className="border border-gray-400 p-3 mb-4">
            <h3 className="font-bold text-base mb-2 border-b border-gray-300 pb-1">OBSERVAÇÕES</h3>
            <div
              className="text-sm prose prose-sm max-w-none"
              dangerouslySetInnerHTML={{ __html: budget.notes }}
            />
          </div>
        )}

        {/* Signature Area */}
        <div className="mt-8 pt-4">
          <div className="flex justify-between gap-8">
            <div className="flex-1 text-center">
              <div className="border-t border-gray-800 pt-2 mx-8">
                <p className="font-semibold">{client.name}</p>
                <p className="text-sm text-gray-600">Cliente</p>
              </div>
            </div>
            <div className="flex-1 text-center">
              <div className="border-t border-gray-800 pt-2 mx-8">
                <p className="font-semibold">
                  {organization?.fantasyName || organization?.enterpriseName || organization?.name}
                </p>
                <p className="text-sm text-gray-600">Vendedor</p>
              </div>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="mt-8 text-center text-xs text-gray-500 border-t border-gray-300 pt-2">
          <p>Este documento não possui valor fiscal.</p>
          <p>
            Recibo emitido em{' '}
            {format(new Date(), "dd 'de' MMMM 'de' yyyy 'às' HH:mm", { locale: ptBR })}
          </p>
        </div>
      </div>
    );
  }
);

SalesReceipt.displayName = 'SalesReceipt';
