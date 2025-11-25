### Cadastro de produtos

| Campos [DB]    | Tipo    | Obrigatório | Descrição                     |
| -------------- | ------- | ----------- | ----------------------------- |
| title          | string  | sim         | Titulo do produto             |
| description    | string  | não         | Descrição do produto          |
| code           | string  | não         | Codigo do produto             |
| unitType       | string  | sim         | Tipo de unidade (m2, unidade) |
| costPrice      | double  | sim         | Preço de custo do produto     |
| salePrice      | double  | sim         | Preço de venda do produto     |
| stock          | number  | sim         | Quantidade em estoque         |
| category       | string  | não         | Categoria do produto [array]  |
| active         | boolean | sim         | Status do produto             |
| organizationId | string  | sim         | ID da organização             |
| createdAt      | string  | sim         | Data de criação               |
| updatedAt      | string  | sim         | Data de atualização           |

---

- **Regras de negócio:**
  - O campo `unitType` deve ser obrigatório e deve ser um dos valores: `m2`, `unidade`.
  - O campo `organizationId` deve ser preenchido com o ID da organização autenticada.

### Listagem

- Deve exibir nas listagem: `title`, `code`, `unitType`, `stock`, `category`
- Deve ter a possibilidade de editar

### Edição

- Deve ter a possibilidade de excluir
