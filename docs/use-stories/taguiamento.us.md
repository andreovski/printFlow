# User Story: Módulo de Cadastro / Taguiamento (CRUD)

**Módulo:** Configurações / Geral
**Tipo:** Feature (Backend + Database)
**Contexto:** Sistema SaaS Multi-tenant (Prisma ORM + PostgreSQL)

---

## 1. Descrição (User Story)

**Como** Administrador da Organização,
**Quero** criar, visualizar, editar e desativar "Tags" (etiquetas) personalizadas, definindo nome, cor e contexto de uso,
**Para que** eu possa classificar visualmente meus Orçamentos e Cards de Produção de forma padronizada.

---

## 2. Regras de Negócio e Comportamento

### 2.1. Escopo e Cores (Melhorias Aplicadas)

- **Escopo:** As tags devem possuir um escopo para evitar poluição visual em módulos onde não fazem sentido.
  - `GLOBAL`: Visível em todo o sistema.
  - `BUDGET`: Visível apenas no módulo de Orçamentos.
  - `PRODUCTION`: Visível apenas no Kanban de Produção.
- **Cores:** O sistema deve armazenar a cor em formato **HEX** (ex: `#FF0000`).
  - _Recomendação de UI:_ O frontend deve priorizar uma paleta pré-definida de cores pastéis para garantir legibilidade do texto interno da tag, mas o backend deve aceitar qualquer string HEX válida.
- **Soft Delete:** Tags não devem ser deletadas permanentemente se já tiverem sido usadas (para manter histórico). Utilizar flag `active`.

### 2.2. Critérios de Aceite (Acceptance Criteria)

#### 🟢 Criar Tag (POST)

- [ ] Deve receber: `name`, `color`, `scope` (opcional, default: GLOBAL).
- [ ] **Validação:** O `name` deve ser único **dentro da mesma Organização** (Case insensitive, se possível).
- [ ] **Segurança:** A tag deve ser automaticamente vinculada ao `organizationId` do usuário logado.
- [ ] O campo `active` deve nascer como `true`.

#### 🔵 Listar Tags (GET)

- [ ] Deve listar apenas as tags da Organização do usuário logado.
- [ ] Deve permitir filtrar por `scope`.
- [ ] Deve permitir filtrar por `active` (trazer ativos e inativos ou apenas ativos).
- [ ] Deve permitir busca textual pelo `name`.

#### 🟡 Atualizar Tag (PUT/PATCH)

- [ ] Deve permitir alterar `name`, `color` e `scope`.
- [ ] Deve validar unicidade do nome novamente caso ele seja alterado.
- [ ] Deve permitir ativar/desativar a tag (alterar boolean `active`).

#### 🔴 Excluir Tag (DELETE)

- [ ] **Soft Delete:** A rota de delete deve, preferencialmente, marcar `active = false` em vez de remover o registro físico do banco, preservando histórico futuro.

---

## 3. Especificação Técnica (Database Schema)

Atualização necessária no arquivo `schema.prisma`.

### 3.1. Novos Enums e Model

Adicione as seguintes estruturas ao esquema:

```prisma
// Define onde a tag será visível
enum TagScope {
  GLOBAL      // Disponível em Orçamentos e Produção
  BUDGET      // Apenas Orçamentos
  PRODUCTION  // Apenas Produção
}

model Tag {
  id             String   @id @default(uuid())
  name           String
  color          String   // Formato HEX. Ex: "#EF4444"

  // Escopo de utilização da tag
  scope          TagScope @default(GLOBAL)

  // Soft delete e controle de disponibilidade
  active         Boolean  @default(true)

  // Relacionamento Multi-tenant
  organizationId String
  organization   Organization @relation(fields: [organizationId], references: [id])

  createdAt      DateTime @default(now())
  updatedAt      DateTime @updatedAt

  // Garante que não existam duas tags com o mesmo nome na mesma empresa
  @@unique([name, organizationId])
  @@map("tags")
}
```

Aqui está a documentação técnica completa em formato Markdown (.md). Ela está estruturada para que o seu agente de IA (ou desenvolvedor) tenha todo o contexto necessário, incluindo as regras de negócio, validações e o schema do banco de dados atualizado com as sugestões.

Copie o conteúdo abaixo para um arquivo chamado US-001-Gestao-Tags.md.

Markdown

# User Story: Módulo de Cadastro / Taguiamento (CRUD)

**Módulo:** Configurações / Geral
**Tipo:** Feature (Backend + Database)
**Contexto:** Sistema SaaS Multi-tenant (Prisma ORM + PostgreSQL)

---

## 1. Descrição (User Story)

**Como** Administrador da Organização,
**Quero** criar, visualizar, editar e desativar "Tags" (etiquetas) personalizadas, definindo nome, cor e contexto de uso,
**Para que** eu possa classificar visualmente meus Orçamentos e Cards de Produção de forma padronizada.

---

## 2. Regras de Negócio e Comportamento

### 2.1. Escopo e Cores (Melhorias Aplicadas)

- **Escopo:** As tags devem possuir um escopo para evitar poluição visual em módulos onde não fazem sentido.
  - `GLOBAL`: Visível em todo o sistema.
  - `BUDGET`: Visível apenas no módulo de Orçamentos.
  - `PRODUCTION`: Visível apenas no Kanban de Produção.
- **Cores:** O sistema deve armazenar a cor em formato **HEX** (ex: `#FF0000`).
  - _Recomendação de UI:_ O frontend deve priorizar uma paleta pré-definida de cores pastéis para garantir legibilidade do texto interno da tag, mas o backend deve aceitar qualquer string HEX válida.
- **Soft Delete:** Tags não devem ser deletadas permanentemente se já tiverem sido usadas (para manter histórico). Utilizar flag `active`.

### 2.2. Critérios de Aceite (Acceptance Criteria)

#### 🟢 Criar Tag (POST)

- [ ] Deve receber: `name`, `color`, `scope` (opcional, default: GLOBAL).
- [ ] **Validação:** O `name` deve ser único **dentro da mesma Organização** (Case insensitive, se possível).
- [ ] **Segurança:** A tag deve ser automaticamente vinculada ao `organizationId` do usuário logado.
- [ ] O campo `active` deve nascer como `true`.

#### 🔵 Listar Tags (GET)

- [ ] Deve listar apenas as tags da Organização do usuário logado.
- [ ] Deve permitir filtrar por `scope`.
- [ ] Deve permitir filtrar por `active` (trazer ativos e inativos ou apenas ativos).
- [ ] Deve permitir busca textual pelo `name`.

#### 🟡 Atualizar Tag (PUT/PATCH)

- [ ] Deve permitir alterar `name`, `color` e `scope`.
- [ ] Deve validar unicidade do nome novamente caso ele seja alterado.
- [ ] Deve permitir ativar/desativar a tag (alterar boolean `active`).

#### 🔴 Excluir Tag (DELETE)

- [ ] **Soft Delete:** A rota de delete deve, preferencialmente, marcar `active = false` em vez de remover o registro físico do banco, preservando histórico futuro.

---

## 3. Especificação Técnica (Database Schema)

Atualização necessária no arquivo `schema.prisma`.

### 3.1. Novos Enums e Model

Adicione as seguintes estruturas ao esquema:

```prisma
// Define onde a tag será visível
enum TagScope {
  GLOBAL      // Disponível em Orçamentos e Produção
  BUDGET      // Apenas Orçamentos
  PRODUCTION  // Apenas Produção
}

model Tag {
  id             String   @id @default(uuid())
  name           String
  color          String   // Formato HEX. Ex: "#EF4444"

  // Escopo de utilização da tag
  scope          TagScope @default(GLOBAL)

  // Soft delete e controle de disponibilidade
  active         Boolean  @default(true)

  // Relacionamento Multi-tenant
  organizationId String
  organization   Organization @relation(fields: [organizationId], references: [id])

  createdAt      DateTime @default(now())
  updatedAt      DateTime @updatedAt

  // Garante que não existam duas tags com o mesmo nome na mesma empresa
  @@unique([name, organizationId])
  @@map("tags")
}
3.2. Atualização no Model Organization
É necessário adicionar o relacionamento inverso no model de Organização existente:

```

model Organization {
id String @id @default(uuid())
name String
// ... outros campos existentes ...

// --- Novos Relacionamentos ---
tags Tag[] // <--- Adicionar esta linha

// ... restante do model ...
}

````

Aqui está a documentação técnica completa em formato Markdown (.md). Ela está estruturada para que o seu agente de IA (ou desenvolvedor) tenha todo o contexto necessário, incluindo as regras de negócio, validações e o schema do banco de dados atualizado com as sugestões.

Copie o conteúdo abaixo para um arquivo chamado US-001-Gestao-Tags.md.

Markdown

# User Story: Módulo de Cadastro / Taguiamento (CRUD)

**Módulo:** Configurações / Geral
**Tipo:** Feature (Backend + Database)
**Contexto:** Sistema SaaS Multi-tenant (Prisma ORM + PostgreSQL)

---

## 1. Descrição (User Story)
**Como** Administrador da Organização,
**Quero** criar, visualizar, editar e desativar "Tags" (etiquetas) personalizadas, definindo nome, cor e contexto de uso,
**Para que** eu possa classificar visualmente meus Orçamentos e Cards de Produção de forma padronizada.

---

## 2. Regras de Negócio e Comportamento

### 2.1. Escopo e Cores (Melhorias Aplicadas)
* **Escopo:** As tags devem possuir um escopo para evitar poluição visual em módulos onde não fazem sentido.
    * `GLOBAL`: Visível em todo o sistema.
    * `BUDGET`: Visível apenas no módulo de Orçamentos.
    * `PRODUCTION`: Visível apenas no Kanban de Produção.
* **Cores:** O sistema deve armazenar a cor em formato **HEX** (ex: `#FF0000`).
    * *Recomendação de UI:* O frontend deve priorizar uma paleta pré-definida de cores pastéis para garantir legibilidade do texto interno da tag, mas o backend deve aceitar qualquer string HEX válida.
* **Soft Delete:** Tags não devem ser deletadas permanentemente se já tiverem sido usadas (para manter histórico). Utilizar flag `active`.

### 2.2. Critérios de Aceite (Acceptance Criteria)

#### 🟢 Criar Tag (POST)
- [ ] Deve receber: `name`, `color`, `scope` (opcional, default: GLOBAL).
- [ ] **Validação:** O `name` deve ser único **dentro da mesma Organização** (Case insensitive, se possível).
- [ ] **Segurança:** A tag deve ser automaticamente vinculada ao `organizationId` do usuário logado.
- [ ] O campo `active` deve nascer como `true`.

#### 🔵 Listar Tags (GET)
- [ ] Deve listar apenas as tags da Organização do usuário logado.
- [ ] Deve permitir filtrar por `scope`.
- [ ] Deve permitir filtrar por `active` (trazer ativos e inativos ou apenas ativos).
- [ ] Deve permitir busca textual pelo `name`.

#### 🟡 Atualizar Tag (PUT/PATCH)
- [ ] Deve permitir alterar `name`, `color` e `scope`.
- [ ] Deve validar unicidade do nome novamente caso ele seja alterado.
- [ ] Deve permitir ativar/desativar a tag (alterar boolean `active`).

#### 🔴 Excluir Tag (DELETE)
- [ ] **Soft Delete:** A rota de delete deve, preferencialmente, marcar `active = false` em vez de remover o registro físico do banco, preservando histórico futuro.

---

## 3. Especificação Técnica (Database Schema)

Atualização necessária no arquivo `schema.prisma`.

### 3.1. Novos Enums e Model

Adicione as seguintes estruturas ao esquema:

```prisma
// Define onde a tag será visível
enum TagScope {
  GLOBAL      // Disponível em Orçamentos e Produção
  BUDGET      // Apenas Orçamentos
  PRODUCTION  // Apenas Produção
}

model Tag {
  id             String   @id @default(uuid())
  name           String
  color          String   // Formato HEX. Ex: "#EF4444"

  // Escopo de utilização da tag
  scope          TagScope @default(GLOBAL)

  // Soft delete e controle de disponibilidade
  active         Boolean  @default(true)

  // Relacionamento Multi-tenant
  organizationId String
  organization   Organization @relation(fields: [organizationId], references: [id])

  createdAt      DateTime @default(now())
  updatedAt      DateTime @updatedAt

  // Garante que não existam duas tags com o mesmo nome na mesma empresa
  @@unique([name, organizationId])
  @@map("tags")
}
```
3.2. Atualização no Model Organization
É necessário adicionar o relacionamento inverso no model de Organização existente:

Snippet de código
````

model Organization {
id String @id @default(uuid())
name String
// ... outros campos existentes ...

// --- Novos Relacionamentos ---
tags Tag[] // <--- Adicionar esta linha

// ... restante do model ...
}

````

### 4. Definição da API (Sugestão de Payload) ###
Exemplo de objeto JSON esperado para criação/edição:

JSON
```
// POST /api/tags
{
  "name": "Urgente",
  "color": "#FF5733",
  "scope": "PRODUCTION"
  // organizationId é injetado pelo backend via token/session
}
```
Exemplo de resposta (Response):

JSON
```
{
  "id": "uuid-gerado",
  "name": "Urgente",
  "color": "#FF5733",
  "scope": "PRODUCTION",
  "active": true,
  "organizationId": "uuid-da-org"
}
```
````
