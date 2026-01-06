# US - Notificações do Sistema

## Resumo

Sistema de notificações em tempo real para alertar usuários sobre eventos importantes relacionados a orçamentos, quadros de produção e contas a pagar.

## Endpoint

```
GET /notifications
```

**Autenticação:** Requer JWT válido  
**Resposta:** Lista de notificações ordenadas por data (mais recentes primeiro)

---

## Regras de Negócio

### 1. Orçamentos (Budget)

#### 1.1 Orçamento com vencimento para o próximo dia

- **Condição:** Orçamentos com status `DRAFT` ou `SENT` onde `expirationDate` seja igual ao dia de amanhã
- **Tipo:** `info`
- **Título:** "Financeiro / Orçamento"
- **Descrição:**
  - Se 1 orçamento: "O orçamento #[código] vence amanhã!"
  - Se N orçamentos: "Você tem [N] orçamentos vencendo amanhã!"
- **Rota de navegação:** `/finance/budgets`

#### 1.2 Orçamento com vencimento no dia atual

- **Condição:** Orçamentos com status `DRAFT` ou `SENT` onde `expirationDate` seja igual a hoje
- **Tipo:** `warning`
- **Título:** "Financeiro / Orçamento"
- **Descrição:**
  - Se 1 orçamento: "O orçamento #[código] vence hoje!"
  - Se N orçamentos: "Você tem [N] orçamentos vencendo hoje!"
- **Rota de navegação:** `/finance/budgets`

#### 1.3 Orçamento aprovado pelo cliente

- **Condição:** Orçamentos com status `ACCEPTED`, `approvedByClient = true`, e `approvedAt` nas últimas 24 horas
- **Tipo:** `success`
- **Título:** "Financeiro / Orçamento"
- **Descrição:** "O orçamento #[código] foi aprovado pelo cliente ([nome do cliente])!"
- **Rota de navegação:** `/finance/budgets/[id]`

#### 1.4 Orçamento rejeitado pelo cliente

- **Condição:** Orçamentos com status `REJECTED`, `approvedByClient = true`, e `approvedAt` nas últimas 24 horas
- **Tipo:** `error`
- **Título:** "Financeiro / Orçamento"
- **Descrição:** "O orçamento #[código] foi recusado pelo cliente ([nome do cliente])."
- **Rota de navegação:** `/finance/budgets/[id]`

---

### 2. Quadros de Produção (Boards)

#### 2.1 Cards com vencimento para o próximo dia

- **Condição:** Cards com `isArchived = false` e `dueDate` igual ao dia de amanhã, em boards ativos
- **Tipo:** `info`
- **Título:** "Produção / Quadros"
- **Descrição:**
  - Se 1 quadro: "Você tem [N] cards vencendo amanhã no quadro '[título]'!"
  - Se N quadros: "Você tem [total] cards vencendo amanhã em [N] quadros!"
- **Rota de navegação:** `/production/boards`

#### 2.2 Cards com vencimento no dia atual

- **Condição:** Cards com `isArchived = false` e `dueDate` igual a hoje, em boards ativos
- **Tipo:** `warning`
- **Título:** "Produção / Quadros"
- **Descrição:**
  - Se 1 quadro: "Você tem [N] cards com a data limite de hoje no quadro '[título]'!"
  - Se N quadros: "Você tem [total] cards com a data limite de hoje em [N] quadros!"
- **Rota de navegação:** `/production/boards`

---

### 3. Contas a Pagar (Accounts Payable)

#### 3.1 Contas com vencimento para o próximo dia

- **Condição:** Contas com status `PENDING`, `deletedAt = null`, e `dueDate` igual ao dia de amanhã
- **Tipo:** `info`
- **Título:** "Financeiro / Contas a Pagar"
- **Descrição:**
  - Se 1 conta: "Você tem 1 conta a pagar vencendo amanhã!"
  - Se N contas: "Você tem [N] contas a pagar vencendo amanhã!"
- **Rota de navegação:** `/finance/accounts-payable`

#### 3.2 Contas com vencimento no dia atual

- **Condição:** Contas com status `PENDING`, `deletedAt = null`, e `dueDate` igual a hoje
- **Tipo:** `warning`
- **Título:** "Financeiro / Contas a Pagar"
- **Descrição:**
  - Se 1 conta: "Você tem 1 conta a pagar vencendo hoje!"
  - Se N contas: "Você tem [N] contas a pagar vencendo hoje!"
- **Rota de navegação:** `/finance/accounts-payable`

---

## Estrutura da Notificação

```typescript
interface Notification {
  id: string; // Identificador único da notificação
  title: string; // Módulo/categoria (ex: "Financeiro / Orçamento")
  description: string; // Texto descritivo do evento
  type: 'info' | 'warning' | 'success' | 'error'; // Tipo visual
  date: string; // Data formatada ("Hoje", "Ontem", "DD/MM")
  route?: string; // Rota para navegação ao módulo relacionado
}
```

## Tipos de Notificação

| Tipo      | Uso                                  | Cor (UI) |
| --------- | ------------------------------------ | -------- |
| `info`    | Avisos de vencimento futuro (amanhã) | Azul     |
| `warning` | Avisos de vencimento no dia atual    | Amarelo  |
| `success` | Orçamentos aprovados pelo cliente    | Verde    |
| `error`   | Orçamentos rejeitados pelo cliente   | Vermelho |

---

## Filtros Aplicados

Todas as notificações respeitam:

- **Multi-tenant:** Filtra por `organizationId` do usuário autenticado
- **Soft delete:** Ignora registros com `deletedAt` preenchido
- **Arquivamento:** Ignora orçamentos e cards arquivados
- **Período:**
  - Vencimentos: Considera hoje e amanhã
  - Aprovações/Rejeições: Últimas 24 horas

---

## Exemplo de Resposta

```json
{
  "notifications": [
    {
      "id": "budget-approved-abc123",
      "title": "Financeiro / Orçamento",
      "description": "O orçamento #1234 foi aprovado pelo cliente (Maria Silva)!",
      "type": "success",
      "date": "Hoje",
      "route": "/orcamentos/abc123"
    },
    {
      "id": "budget-expiring-today-1704499200000",
      "title": "Financeiro / Orçamento",
      "description": "Você tem 3 orçamentos vencendo hoje!",
      "type": "warning",
      "date": "Hoje",
      "route": "/orcamentos"
    },
    {
      "id": "accounts-due-tomorrow-1704499200000",
      "title": "Financeiro / Contas a Pagar",
      "description": "Você tem 2 contas a pagar vencendo amanhã!",
      "type": "info",
      "date": "Hoje",
      "route": "/contas-pagar"
    }
  ]
}
```

---

## Considerações de Performance

- As queries são executadas em paralelo usando `Promise.all`
- Não há persistência de notificações - são calculadas em tempo real
- Recomendado implementar cache no frontend para evitar chamadas excessivas

---

## Integração com Frontend

O componente `GlobalSearchNotifications` no frontend consome este endpoint. A propriedade `route` deve ser usada para navegação ao clicar na notificação.

---

## Próximas Evoluções (Backlog)

- [ ] Notificações de orçamentos vencidos (passados)
- [ ] Notificações de contas vencidas/atrasadas
- [ ] Persistência de notificações lidas
- [ ] WebSocket para notificações em tempo real
- [ ] Configuração de preferências de notificação por usuário
- [ ] Notificações por e-mail
