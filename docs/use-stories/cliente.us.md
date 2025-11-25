### Cadastro de Clientes

Formulário:

| Campos [DB]    | Tipo    | Obrigatório              | Descrição                                      |
| -------------- | ------- | ------------------------ | ---------------------------------------------- |
| personType     | string  | sim                      | Tipo de pessoa (Física, Jurídica, Estrangeiro) |
| name           | string  | sim (física/estrangeiro) | Nome ou Razão Social                           |
| fantasyName    | string  | sim (jurídica)           | Nome fantasia                                  |
| document       | string  | sim (física)             | CPF                                            |
| cnpj           | string  | sim (jurídica)           | CNPJ                                           |
| document       | string  | sim (estrangeiro)        | Documento                                      |
| email          | string  | sim                      | Email                                          |
| phone          | string  | sim                      | Telefone                                       |
| isWhatsapp     | boolean | sim                      | Indica se o telefone é WhatsApp                |
| rg             | string  | não                      | RG                                             |
| cep            | string  | sim                      | CEP                                            |
| addressType    | string  | não                      | Tipo de endereço (Residencial, Comercial)      |
| address        | string  | sim                      | Endereço                                       |
| addressNumber  | string  | sim                      | Número                                         |
| complement     | string  | não                      | Complemento                                    |
| neighborhood   | string  | sim                      | Bairro                                         |
| city           | string  | sim                      | Cidade                                         |
| state          | string  | sim                      | Estado                                         |
| country        | string  | sim                      | País                                           |
| notes          | string  | não                      | Observações                                    |
| active         | boolean | sim                      | Indica se o cliente está ativo                 |
| organizationId | string  | sim                      | ID da organização                              |
| createdAt      | string  | sim                      | Data de criação                                |
| updatedAt      | string  | sim                      | Data de atualização                            |
