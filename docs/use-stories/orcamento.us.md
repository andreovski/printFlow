# Especificação Técnica: Módulo de Orçamentos

Este documento descreve os requisitos funcionais, regras de negócio e modelagem de dados para a implementação do módulo de Orçamentos.

**Nota para o Desenvolvedor:** A estrutura de dados foi normalizada para suportar bancos relacionais (SQL). Não utilize arrays JSON para salvar os produtos dentro da tabela de orçamento. Utilize uma tabela pivô (relacional).

---

## 1. Modelagem de Dados (Schema Suggestion)

A estrutura deve ser composta por duas entidades principais: `Budget` (Cabeçalho) e `BudgetItem` (Itens).

### Tabela: Budget (Orçamentos)

Representa o documento do orçamento.

| Campo            | Tipo (Sugestão) | Obrigatório | Descrição                                                                       |
| :--------------- | :-------------- | :---------- | :------------------------------------------------------------------------------ |
| `id`             | UUID            | Sim         | Chave Primária.                                                                 |
| `code`           | String          | Sim         | Código amigável para o cliente (ex: ORC-001). Auto-incremental ou gerado.       |
| `clientId`       | UUID            | Sim         | Chave estrangeira para a tabela de Clientes.                                    |
| `status`         | Enum            | Sim         | Valores: `DRAFT`, `SENT`, `ACCEPTED`, `REJECTED`, `DONE`. Default: `DRAFT`. |
| `expirationDate` | DateTime        | Não         | Data de validade do orçamento.                                                  |
| `discountType`   | Enum            | Não         | Tipo de desconto global (`PERCENT`, `VALUE`).                                   |
| `discountValue`  | Decimal         | Não         | Valor numérico do desconto global.                                              |
| `subtotal`       | Decimal         | Sim         | Soma total dos itens (sem o desconto global).                                   |
| `total`          | Decimal         | Sim         | Valor final a pagar (`subtotal` - `desconto global`).                           |
| `notes`          | Text            | Não         | Observações internas ou para o cliente.                                         |
| `createdAt`      | DateTime        | Sim         | Data de criação.                                                                |
| `updatedAt`      | DateTime        | Sim         | Data de atualização.                                                            |
| `deletedAt`      | DateTime        | Não         | Para uso de Soft Delete.                                                        |

### Tabela: BudgetItems (Itens do Orçamento)

Representa os produtos adicionados ao orçamento. Esta tabela garante o histórico de preços (Snapshot).

| Campo           | Tipo (Sugestão) | Obrigatório | Descrição                                                                  |
| :-------------- | :-------------- | :---------- | :------------------------------------------------------------------------- |
| `id`            | UUID            | Sim         | Chave Primária.                                                            |
| `budgetId`      | UUID            | Sim         | FK para a tabela `Budget`.                                                 |
| `productId`     | UUID            | Sim         | FK para a tabela `Product` (para métricas futuras).                        |
| `name`          | String          | Sim         | **Snapshot:** Nome do produto no momento da adição (caso o original mude). |
| `quantity`      | Int             | Sim         | Quantidade do item.                                                        |
| `costPrice`     | Decimal         | Sim         | **Snapshot:** Custo do produto no momento da adição (Read-only na UI).     |
| `salePrice`     | Decimal         | Sim         | Preço unitário de venda.                                                   |
| `discountType`  | Enum            | Não         | Tipo de desconto no item (`PERCENT`, `VALUE`).                             |
| `discountValue` | Decimal         | Não         | Valor do desconto no item.                                                 |
| `total`         | Decimal         | Sim         | Cálculo: `(salePrice * quantity) - desconto`.                              |

---

## 2. Funcionalidades e Requisitos (Backend)

### CRUD de Orçamentos

- **Criar:** Deve ser possível criar um orçamento com status inicial `DRAFT`.
- **Editar:** Permitido apenas se o status for `DRAFT` ou `REJECTED`. Se estiver `SENT`, o usuário deve ter opção de reabir mudando o status para `DRAFT`.
- **Listar:** Deve listar orçamentos com paginação.
- **Excluir:** Implementar **Soft Delete** (apenas preencher `deletedAt`), não remover o registro físico do banco para manter histórico financeiro.
- **Status:** Permitir transição de status conforme fluxo de negócio.

### Regras de Cálculo (Ordem de Execução)

Para evitar erros de arredondamento, o sistema deve seguir esta ordem estrita:

1.  **Item Total:** `(Preço Venda Unitário * Quantidade) - Desconto do Item`.
2.  **Subtotal Orçamento:** Soma de todos os `Item Total`.
3.  **Total Final:** `Subtotal Orçamento - Desconto Global (se houver)`.

### Regra de Snapshot (Histórico)

Ao adicionar um produto ao orçamento, o sistema deve copiar o `costPrice` (preço de custo) e o `name` da tabela de Produtos para a tabela `BudgetItems`.

- **Motivo:** Se o custo do produto aumentar no futuro, o orçamento antigo não deve ter sua margem de lucro alterada retroativamente.

---

## 3. Requisitos de Interface (Frontend/UI)

### Seleção de Cliente

- Menu dropdown com busca integrada (Searchable Select).
- O endpoint deve retornar no máximo **10 clientes** paginados por demanda (lazy loading ou infinite scroll) durante a busca.

### Seleção e Grid de Produtos

- **Busca:** Dropdown para buscar produto por título.
- **Paginação:** Carregar no máximo **10 produtos** por vez na busca.
- **Grid de Itens:** Ao selecionar, o produto vai para um grid (tabela) abaixo.
  - **Colunas Visíveis:** Nome, Qtd, Custo (Read-only), Venda (Read-only base, mas permite desconto), Desconto, Total.
  - **Edição no Grid:** Permitir editar apenas `Quantidade` e `Desconto` (Valor/Porcentagem).
  - **Remoção:** Botão para remover item do grid (enquanto rascunho).

### Visualização de Valores

- **Custo:** O valor de custo (`costPrice`) deve ser visível no grid para ajudar na precificação, mas **não editável**.
- **Totais:**
  - Exibir o total de cada linha (produto).
  - Exibir o Subtotal do orçamento.
  - Exibir campo para Desconto Global.
  - Exibir Total Final destacado.

### Menu e Acesso

- Rota: `/financeiro/orcamentos`.
- Acesso via barra lateral no módulo Financeiro.
