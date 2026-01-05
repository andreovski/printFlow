### Módulo: Financeiro - Contas a Pagar

Como usuário ADMIN ou MASTER, eu quero pode cadastrar uma conta a pagar no sistema
Para que eu possa aconpanhar as contas que necessito pagar ao longo do mês.

#### Cenário: Cadastro de Conta a Pagar

Dado que eu sou um usuário com perfil ADMIN ou MASTER
E estou autenticado no sistema
Quando eu acesso o módulo de Contas a Pagar
E eu clico na opção para adicionar uma nova conta a pagar
E eu preencho o formulário com as seguintes informações:
| Campo | Valor |
|----------------------|----------------------------|
| Fornecedor | Empresa XYZ |
| Icone | SVGs disponíveis |
| Data de Vencimento | 30/06/2024 |
| Valor | R$ 1.500,00 |
| Status | Pendente |
| Parcelas | 3 |
| Etique | Serviços |
| Descrição | Pagamento de serviços de consultoria |
| Data de Pagamento | 30/06/2024 |
| Total | R$ 1.500,00 |

E eu clico no botão "Salvar"
Deve-se criar a nova conta a pagar
E eu devo ver a nova conta a pagar listada no módulo de Contas a Pagar

Obs-01: O campo "Icone" deve permitir a seleção de SVGs disponíveis no sistema.
Obs-02: O campo "Status" deve permitir a seleção entre "Pendente", "Pago" e "Atrasado".
Obs-07: O campo "Etique" deve permitir a seleção das etiquetas dentro do escopo (Create a new `TagScope`)
Obs-03: O campo "Parcelas" deve permitir a inserção do número de parcelas (1 a 99).
Obs-04: O campo "Data de Pagamento" deve ser preenchido apenas se o status for "Pago".
Obs-05: O campo "Total" deve ser calculado automaticamente com base no valor e número de parcelas.
Obs-06: Todos os campos são obrigatórios, exceto "Data de Pagamento" quando o status for "Pendente" ou "Atrasado".

#### Cenário: Visualização de Conta a Pagar

Dado que eu sou um usuário com perfil ADMIN ou MASTER
E estou autenticado no sistema
E existe uma conta a pagar cadastrada no sistema
Quando eu acesso o módulo de Contas a Pagar
Eu devo poder visualizar as contas a pagar listada por dia com uma visualização vertical.
E eu clico na conta a pagar cadastrada
Então eu devo ver os detalhes completos da conta a pagar.
E eu posso alterar quaisquer informações da conta a pagar.
E eu clico no botão "Salvar" para atualizar as informações.

#### Cenário: Filtragem por mês de Contas a Pagar

Dado que eu sou um usuário com perfil ADMIN ou MASTER
E estou autenticado no sistema
E existem várias contas a pagar cadastradas no sistema
Quando eu acesso o módulo de Contas a Pagar
Eu quero poder filtrar por mês no topo da tela
E eu quero poder ter um calendário lateral para facilitar a navegação entre os meses

### Cenário: Dashboard de Contas a Pagar

Dado que eu sou um usuário com perfil ADMIN ou MASTER
E estou autenticado no sistema
E existem várias contas a pagar cadastradas no sistema
Quando eu acesso o módulo de Contas a Pagar
Eu quero ver um dashboard resumido no topo da tela
Onde eu possa ver:

- Total de Contas a Pagar no mês ou no periodo selecionado
- Total Pago no mês
- Total Pendente no mês

Obs: Utilizar range-dates para filtrar os dados do conforme o período selecionado.
