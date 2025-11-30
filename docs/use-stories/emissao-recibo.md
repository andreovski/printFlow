# Especificação Técnica: Módulo de Emissão de Recibo de Venda (MVP)

## 1. Visão Geral

Implementação da funcionalidade de impressão de **Recibo de Venda** (Cupom não fiscal) a partir de um orçamento (`Budget`) aprovado. O sistema deve utilizar a biblioteca `react-to-print` para gerar um layout A4 baseado no modelo "Magic Impressão Digital".

**Restrição Importante:** Nenhuma alteração será feita no banco de dados (`schema.prisma`) neste momento. Campos inexistentes serão tratados como estáticos ou calculados.

---

## 2. Regras de Negócio

1.  **Gatilho:** Botão "Imprimir Recibo" na tela de detalhes do Orçamento.
2.  **Condição de Exibição:** O botão só aparece se `budget.status === 'ACCEPTED'`.
3.  **Layout:** O recibo deve ser renderizado apenas no momento da impressão, ocultando o restante da interface do SaaS.

---

## 3. Requisitos de Backend (Prisma Service)

A query deve buscar o orçamento com os relacionamentos necessários para preencher o cabeçalho (Empresa), destinatário (Cliente) e corpo (Itens).

**Query necessária:**

```javascript
const budget = await prisma.budget.findUnique({
  where: { id: budgetId },
  include: {
    client: true, // Dados do cliente
    organization: true, // Cabeçalho do recibo
    items: {
      include: {
        product: true, // Para acessar código/SKU original se necessário
      },
    },
  },
});
```

4. Mapeamento de Dados (Front-end)Como não alteraremos o banco, os campos faltantes devem ser tratados no front-end conforme a tabela abaixo:Campo Visual no ReciboFonte do Dado (Objeto budget)Tratamento / FallbackCabeçalho (Empresa)budget.organization.*Usar fantasyName ou name. Endereço concatenado.Clientebudget.client.*Exibir dados retornados. Se rg for null, mostrar "-".Atendente/VendedorNão existe no bancoExibir string vazia ou traço "-".FreteNão existe no banco**Exibir fixo "R$ 0,00"**.Produtosbudget.itemsIterar sobre o array.Valores (Subtotal)budget.subtotalFormatar moeda BRL.Descontosbudget.discountValueSe null, exibir "R$ 0,00".Total a Pagarbudget.totalValor final.Entrada (Sinal)budget.advancePaymentSe null, assumir 0.Saldo DevedorCálculo em memória`budget.total - (budget.advancePayment5. Implementação do Componente VisualO componente SalesReceipt deve ser ajustado para lidar com a ausência dos campos ignorados.Estrutura Sugerida (React/Tailwind)TypeScript// Trecho focado nas partes estáticas (Sem Seller/Shipping)

{/_ Linha do Vendedor _/}

<div className="border border-gray-400 p-1 mb-2">
  <span className="font-bold">Atendente/Vendedor: </span>
  <span>-</span> {/* Deixar fixo ou vazio já que não temos sellerId */}
</div>

{/_ ... Tabela de Itens ... _/}

{/_ Bloco de Totais _/}

<div className="border border-gray-400 p-2 mb-2 bg-gray-50">
  {/* ... Subtotal e Descontos ... */}
  
  <div className="flex justify-end mb-1">
       {/* Frete Hardcoded como 0.00 pois o campo foi desconsiderado */}
       <span>Valor do Frete: R$ 0,00</span> 
  </div>

  <div className="flex justify-between border-t border-gray-300 pt-1 mt-1 text-lg">
       <strong>Valor a Pagar:</strong>
       <strong>{new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(Number(budget.total))}</strong>
  </div>
</div>
6. Checklist de Entrega[ ] Criar componente SalesReceipt.tsx com Tailwind (estilo de impressão).[ ] Implementar lógica de cálculo de saldo (total - advancePayment).[ ] Adicionar botão com react-to-print na página de view do Budget.[ ] Garantir que o botão só renderize se status === 'ACCEPTED'.
