# História de Usuário: Módulo de Quadros (Kanban)

> **Título:** Implementação do Módulo de Gestão de Quadros e Colunas com Ordenação
>
> **Contexto:**
> Estamos desenvolvendo um SaaS para gráficas (PrintFlow). Precisamos criar a estrutura base do Kanban para gerenciar o fluxo de trabalho da produção. O sistema utiliza Prisma ORM e arquitetura multi-tenant (por Organização).
>
> **Ator:** Usuário Autenticado (Vinculado a uma Organização).
>
> **Objetivo:**
> Como usuário, quero criar, gerenciar e reordenar quadros de tarefas e suas respectivas colunas, para que eu possa organizar visualmente e priorizar as etapas de produção da gráfica conforme minha necessidade.

## 1. Modelagem de Dados (Prisma Schema)

```prisma
model Organization {
  id        String   @id @default(uuid())
  boards    Board[]
  // [...]
}

model Board {
  id             String       @id @default(uuid())
  title          String
  description    String?      @db.Text
  isArchived     Boolean      @default(false)
  createdAt      DateTime     @default(now())
  updatedAt      DateTime     @updatedAt

  organizationId String
  organization   Organization @relation(fields: [organizationId], references: [id])

  columns        BoardColumn[]
}

model BoardColumn {
  id        String   @id @default(uuid())
  title     String
  order     Int      // Define a posição da coluna (0, 1, 2...)
  cards     Card[]   // Relacionamento com os cartões

  boardId   String
  board     Board    @relation(fields: [boardId], references: [id], onDelete: Cascade)

  createdAt DateTime @default(now())
  updatedAt DateTime @updatedAt

  @@index([boardId])
}

model Card {
  id          String       @id @default(uuid())
  title       String       // Ex: "Cartões de Visita - Cliente X"
  description String?      @db.Text
  position    Int          // Posição vertical do card dentro da coluna (0, 1, 2...)
  priority    CardPriority @default(MEDIUM)
  dueDate     DateTime?    // Prazo de entrega do serviço

  columnId    String
  column      BoardColumn  @relation(fields: [columnId], references: [id], onDelete: Cascade)

  createdAt   DateTime     @default(now())
  updatedAt   DateTime     @updatedAt

  @@index([columnId])
}
```

Você tem toda razão. Um Kanban sem os Cartões (Cards) não é funcional.

No contexto de uma gráfica, o Card geralmente representa um Pedido, um Item de Pedido ou uma Tarefa interna (ex: "Manutenção da Offset").

Abaixo, apresento o arquivo Markdown completo e atualizado. Adicionei a modelagem da tabela Card com campos essenciais para priorização e prazos, além das regras de movimentação (vertical e horizontal).

Markdown

# História de Usuário: Sistema de Gestão de Quadros (Kanban) Completo

> **Título:** Implementação do Módulo Kanban (Quadros, Colunas e Cartões)
>
> **Contexto:**
> Estamos desenvolvendo um SaaS para gráficas (PrintFlow). O objetivo é gerenciar o fluxo de produção (ex: Arte -> Impressão -> Acabamento). O sistema utiliza Prisma ORM e arquitetura multi-tenant.
>
> **Ator:** Usuário Autenticado (Vinculado a uma Organização).
>
> **Objetivo:**
> Criar quadros, gerenciar colunas e manipular cartões (tarefas/jobs), permitindo a movimentação livre dos cartões entre colunas e a reordenação para definir prioridades.

## 1. Modelagem de Dados (Prisma Schema)

```prisma
// Enums ajudam a padronizar a prioridade no banco
enum CardPriority {
  LOW
  MEDIUM
  HIGH
  URGENT
}

model Organization {
  id        String   @id @default(uuid())
  name      String
  boards    Board[]
}

model Board {
  id             String       @id @default(uuid())
  title          String
  description    String?      @db.Text
  isArchived     Boolean      @default(false)
  createdAt      DateTime     @default(now())
  updatedAt      DateTime     @updatedAt

  organizationId String
  organization   Organization @relation(fields: [organizationId], references: [id])

  columns        BoardColumn[]
}

model BoardColumn {
  id        String   @id @default(uuid())
  title     String
  order     Int      // Posição horizontal da coluna (0, 1, 2...)

  boardId   String
  board     Board    @relation(fields: [boardId], references: [id], onDelete: Cascade)

  cards     Card[]   // Relacionamento com os cartões

  createdAt DateTime @default(now())
  updatedAt DateTime @updatedAt

  @@index([boardId])
}

model Card {
  id          String       @id @default(uuid())
  title       String       // Ex: "Cartões de Visita - Cliente X"
  description String?      @db.Text
  position    Int          // Posição vertical do card dentro da coluna (0, 1, 2...)
  priority    CardPriority @default(MEDIUM)
  dueDate     DateTime?    // Prazo de entrega do serviço

  columnId    String
  column      BoardColumn  @relation(fields: [columnId], references: [id], onDelete: Cascade)

  createdAt   DateTime     @default(now())
  updatedAt   DateTime     @updatedAt

  @@index([columnId])
}
```

## 2. Requisitos Funcionais & Regras de Negócio

### 2.1. Estrutura do Quadro (Board & Colunas)

Criação Padrão: Ao criar um quadro, gerar automaticamente as colunas: "A Fazer" (0), "Em Andamento" (1), "Feito" (2).

Gestão de Colunas: Permitir criar, editar, excluir e reordenar colunas (Drag & Drop horizontal).

### 2.2. Gestão de Cartões (Cards)

Criar: O usuário pode adicionar um cartão em uma coluna específica.

Campos obrigatórios: Título, Coluna ID.

Campos opcionais: Descrição, Prioridade (Default: MEDIUM), Data de Entrega.

Lógica de Ordem: O novo cartão deve ser inserido no topo (position: 0) ou no final da lista, ajustando os demais.

Editar: Permitir alterar título, descrição, prioridade e data.

Excluir: Remover o cartão do banco de dados.

### 2.3. Movimentação de Cartões (Drag & Drop Avançado)

O sistema deve suportar dois tipos de movimento:

Reordenação Vertical: Mover um cartão para cima ou para baixo dentro da mesma coluna (altera o campo position).

Movimento entre Colunas: Mover um cartão da coluna "A" para a coluna "B" (altera columnId e recalcula position na nova coluna).

### 3. Critérios de Aceite (Backend)

[ ] Schema: Tabelas Board, BoardColumn e Card implementadas corretamente.

[ ] Endpoints de Cartões:

    POST /columns/:columnId/cards: Cria um cartão.

    PUT /cards/:id: Atualiza dados do cartão.

    DELETE /cards/:id: Remove o cartão.

    [ ] Endpoint de Movimentação (Crítico):

    PATCH /cards/move:

    Deve receber: cardId, destinationColumnId, newPosition.

Lógica: Se a coluna de destino for diferente da atual, atualizar columnId.

Transação: Deve atualizar a position do cartão movido e reordenar os cartões afetados na coluna de origem e destino para evitar buracos ou índices duplicados.

```

```
