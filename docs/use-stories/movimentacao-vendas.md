# Especificação Técnica: Módulo de Movimentação de Vendas

## 1. Visão Geral

Desenvolvimento de um dashboard administrativo financeiro para consolidar dados de orçamentos aprovados. O objetivo é permitir a visualização de faturamento, custos e lucro real, com controle manual sobre quais itens compõem os totais.

**Permissões:** Acesso restrito a perfis **ADM** e **MASTER**.
**Localização:** Novo item "Movimentação de Vendas" na Sidebar.

---

## 2. Alterações de Banco de Dados (Backend)

- **Tabela Alvo:** `Budgets` (Orçamentos).
- **Novo Campo:** Criar coluna `excluded_from_sales` (Boolean).
  - **Default:** `false`.
  - **Descrição:** Indica se o orçamento, mesmo aprovado, deve ser ignorado nos cálculos financeiros.

---

## 3. Regras de Negócio e Filtros

### 3.1. Filtros de Dados

A listagem e os cálculos devem considerar apenas registros que atendam cumulativamente a:

1.  **Status:** Estritamente igual a `'APROVADO'`.
2.  **Período:** Intervalo de datas selecionado pelo usuário (Ex: Data de Aprovação).
    - _Default:_ Ao carregar a página, filtrar pelo **Mês Atual**.

### 3.2. Lógica de Exclusão (Persistence)

- O usuário pode marcar/desmarcar um orçamento para contabilização.
- Essa ação deve ser **persistida no banco de dados** (atualizando o campo `excluded_from_sales`).
- Se um orçamento mudar de status (ex: for cancelado), ele deve sumir automaticamente desta tela.

### 3.3. Fórmulas de KPIs

Os indicadores devem somar **todos** os registros do período filtrado onde `excluded_from_sales = false`.

1.  **Faturamento Total:** $\sum \text{Preço de Venda}$
2.  **Custo Total:** $\sum \text{Preço de Custo}$
3.  **Lucro Bruto (R$):** $\text{Faturamento Total} - \text{Custo Total}$
4.  **Margem (%):** $(\frac{\text{Lucro Bruto}}{\text{Faturamento Total}}) \times 100$

---

## 4. Interface de Usuário (UI/UX)

### 4.1. Topo: Filtros e KPIs

- **Seletor de Data:** Inputs de "Início" e "Fim" + Botão Filtrar.
- **Cards de Resumo:** 4 Cards destacados exibindo os resultados das fórmulas acima.
  - _Nota:_ Os totais dos cards devem refletir o período inteiro, independente da paginação da tabela.

### 4.2. Tabela de Listagem

- **Colunas:** ID, Cliente, Data, Valor Venda, Valor Custo, Lucro (do item), Status, **Contabilizar**.
- **Paginação:** Implementar paginação no backend (ex: 20 itens por página).
- **Ação de Redirecionamento:** Clicar na linha redireciona para a tela de detalhes do orçamento.

### 4.3. Toggle "Contabilizar"

- Um componente visual (Switch/Toggle) na coluna da tabela.
- **Estado:**
  - ON: `excluded_from_sales = false` (Contabiliza).
  - OFF: `excluded_from_sales = true` (Ignora).
- **Comportamento:** Ao clicar, deve salvar no banco via AJAX e atualizar os Cards de KPI instantaneamente sem recarregar a página.

---

## 5. Notas para o Desenvolvedor

- **Atenção à Paginação vs. Totais:**
  - A query da **tabela** deve usar `LIMIT/OFFSET`.
  - A query dos **KPIs** deve ser separada (ou uma aggregation query) que considere todo o range de datas, ignorando o `LIMIT` da paginação, mas respeitando o filtro `excluded_from_sales`.
