# História de Usuário: Gerenciamento de Templates Personalizados

**ID:** US-TEMPLATES-01
**Status:** To Do
**Prioridade:** Alta

---

## 1. Descrição (User Story)

**Como** administrador do sistema,
**Quero** criar, editar, visualizar e excluir templates de texto (CRUD) definindo um escopo de utilização,
**Para que** eu possa padronizar documentos e mensagens nos módulos de Produção, Orçamento ou Globalmente.

---

## 2. Critérios de Aceite (Acceptance Criteria)

### 2.1. Cadastro e Edição

- [ ] **Dados Básicos:** O formulário deve exigir um `Nome` para identificação do template.
- [ ] **Seletor de Escopo (`scope`):**
  - Deve ser um campo obrigatório do tipo _Select/Dropdown_.
  - Deve conter estritamente as opções: `GLOBAL`, `PRODUCTION`, `BUDGET`.
  - O template deve pertencer a apenas um escopo por vez.
- [ ] **Editor de Conteúdo:**
  - O campo de texto deve ser um _Rich Text Editor_ (WYSIWYG).
  - O sistema deve converter e salvar o conteúdo em formato **Markdown**.
  - O campo deve suportar textos longos.

### 2.2. Listagem

- [ ] A tabela de listagem deve exibir: `Nome`, `Escopo` (com badge visual sugerido) e `Data de Criação`.
- [ ] Deve permitir a exclusão de um template (com confirmação).

---

## 3. Especificações Técnicas (Developer Notes)

### Schema Prisma Sugerido

O campo `content` deve utilizar `@db.Text` para garantir suporte a grandes volumes de caracteres do Markdown.

```prisma
// 1. Enum para restringir os escopos
enum Scope { // Renomear para Scope
  GLOBAL
  PRODUCTION // Trocar para BOARD
  BUDGET // Manter BUDGET
}

// 2. Modelo da tabela
model Template {
  id        String        @id @default(cuid())
  name      String
  content   String        @db.Text
  scope     Scope

  // Relação com Tenant (Descomentar se necessário)
  // tenantId String
  // tenant   Tenant @relation(fields: [tenantId], references: [id])

  createdAt DateTime      @default(now())
  updatedAt DateTime      @updatedAt

  @@map("templates")
  @@index([scope])
}
```
