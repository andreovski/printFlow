# Especificação de Funcionalidade: Vínculo de Orçamento ao Card (Kanban)

## 1. Visão Geral

Implementar a capacidade de vincular um **Orçamento (Budget)** aprovado a um **Card (Board)** durante o processo de criação do card. Este vínculo serve para importar dados iniciais (Snapshot) do orçamento para o card, facilitando a transição de vendas para produção.

**Fluxo Resumido:**

1. Usuário abre modal "Novo Cartão".
2. Seleciona um Orçamento Aprovado em um novo campo.
3. O sistema preenche automaticamente o título do card com o telefone do cliente.
4. O sistema importa as tags do orçamento (respeitando regras de escopo).
5. Ao salvar, o vínculo é persistido.

---

## 2. Banco de Dados

### Tabela: `cards`

Adicionar uma coluna para armazenar a referência ao orçamento.

- **Coluna:** `budget_id`
- **Tipo:** Inteiro / UUID (conforme padrão do sistema).
- **Constraint:** `Foreign Key` para a tabela `budgets`.
- **Nullable:** `TRUE` (pois nem todo card vem de um orçamento).

---

## 3. Backend (API)

### Endpoint: Listagem de Orçamentos (Opções do Select)

O endpoint que lista orçamentos para o _dropdown_ deve aceitar filtros para retornar apenas os aptos ao vínculo.

- **Filtro:** `status = 'APPROVED'` (ou status equivalente no enum do sistema).
- **Payload de Resposta Esperado (mínimo):**
  ```json
  [
    {
      "id": 1023,
      "code": "#1023",
      "total": 90.0,
      "client": {
        "name": "Andre Luiz",
        "phone": "41999999999"
      },
      "tags": [
        { "id": 1, "name": "Urgente", "scope": "GLOBAL" },
        { "id": 2, "name": "Financeiro", "scope": "BUDGET_ONLY" }
      ]
    }
  ]
  ```

. Frontend (Interface & Lógica)4.1. Modal de Criação/Edição de CardLocalização: Inserir o novo campo no topo do formulário, antes do campo "Título".Componente: Seletor de OrçamentoLabel: "Vincular Orçamento (Opcional)"Tipo: Select / Autocomplete (Async).Display: Deve mostrar ID/Código - Cliente - Valor (ex: #1023 - Andre Luiz - R$ 90,00).Comportamento (Eventos)Evento onChange (Ao selecionar um orçamento):Ação 1 (Título): Buscar o telefone do cliente no objeto do orçamento selecionado e definir como valor do campo title (Título do Card).Formatação: Se possível, manter a máscara de telefone.Ação 2 (Tags): Iterar sobre as tags do orçamento selecionado.Aplicar filtro: Ignorar tags onde o escopo seja restrito ao orçamento (ex: scope === 'BUDGET_ONLY').Adicionar as tags restantes ao array de tags do formulário do card.Nota: Manter tags que o usuário já tenha adicionado manualmente (merge sem duplicatas).Estado de Edição (Edit Mode):Ao abrir um card que já possui budget_id preenchido:O campo "Vincular Orçamento" deve ser exibido com o orçamento selecionado.Importante: O campo deve estar DESABILITADO (Disabled/Read-only). Não é permitido alterar o vínculo de um card já criado.Independência de Dados (No Sync):A cópia de dados (Título e Tags) ocorre apenas no evento de seleção (criação).Edições posteriores no Orçamento original NÃO devem alterar o Card automaticamente.Edições posteriores no Card NÃO devem alterar o Orçamento.5. Regras de Negócio (Resumo)RegraDescriçãoStatus do OrçamentoApenas orçamentos com status Aprovado podem ser listados para vínculo.Sobrescrita de TítuloO título do card é sobrescrito pelo telefone do cliente imediatamente após a seleção do orçamento.Escopo de TagsTags de uso exclusivo do módulo "Financeiro/Orçamento" não devem ser importadas para o módulo "Produção/Boards".Imutabilidade do VínculoUma vez criado o card vinculado a um orçamento, esse vínculo não pode ser alterado via interface de edição do card (campo travado).6. Exemplo de Código (Lógica do Frontend)JavaScript/\*\*

- Função disparada ao selecionar um orçamento no dropdown.
- @param {Object} selectedBudget - Objeto completo do orçamento selecionado
- @param {Object} form - Instância do formulário (ex: useForm do React Hook Form ou AntD)
  \*/
  const handleBudgetSelect = (selectedBudget) => {
  if (!selectedBudget) return;

// 1. Define o ID do orçamento no form
form.setValue('budget_id', selectedBudget.id);

// 2. Define o Título como o Telefone do Cliente
// Fallback: Se não tiver telefone, usa o nome para não deixar vazio
const cardTitle = selectedBudget.client.phone || selectedBudget.client.name;
form.setValue('title', cardTitle);

// 3. Lógica de Tags
const currentTags = form.getValues('tags') || [];

// Filtra tags que não são exclusivas de orçamento
// Ajuste a propriedade 'scope' conforme a modelagem real do banco
const validBudgetTags = selectedBudget.tags.filter(
tag => tag.scope !== 'BUDGET_ONLY'
);

// Combina tags existentes com as novas, removendo duplicatas por ID
const mergedTags = [...currentTags, ...validBudgetTags];
const uniqueTags = Array.from(new Set(mergedTags.map(t => t.id)))
.map(id => mergedTags.find(t => t.id === id));

form.setValue('tags', uniqueTags);
};

```

```
