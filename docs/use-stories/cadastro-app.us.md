### Modulo: Autenticação - Cadastro

## Cadastro de usuário.

O usuário deve ser capaz de se cadastrar no sistema.
Na tela de login, deve ter um botão para direcionar o usuário ao cadastro.
Após o usuário informar seu nome, email, senha e um código de acesso antecipado ao sistema.
O sistema deve validar se o código de acesso é válido (codigo de acesso antecipado estará nas envs).
O sistema deve validar se já não existe um usuário com o email informado.
Se existir, deve mostrar uma mensagem de erro.
Se não existir, deve criar um usuário.
O sistema deve redirecionar o usuário para a tela de cadastro de uma organização.

## Login

O usuário deve ser capaz de se logar no sistema.
Após o usuário informar seu email e senha, o sistema deve validar se o usuário existe e se a senha informada é a mesma cadastrada.
Se o login for valido, o sistema deve verificar se o usuário possui uma organização.
Se o usuário não possui uma organização, o sistema deve redirecionar o usuário para de cadastro de uma organização.
Se o usuário não possuir uma organização vinculada ao seu perfil, só poderá ter acesso a tela de cadastro de uma organização.
Se o usuário possuir uma organização vinculada ao seu perfil, o sistema deve redirecionar o usuário para dashboard da organização em que faz parte.

### Cadastro de uma organização.

O usuário deve ser capaz de se cadastrar em uma organização.
O usuário deve informar o cnpj da organização `cnpj` (opcional).
O usuário deve informar o nome da organização (replicar valor do campo `name` para o campo `fantasyName`).
O usuário deve informar o nome da empresa `enterpriseName` (opcional).
O usuário deve informar o e-mail da organização `mainEmail`.
O usuário deve informar o telefone da organização `mainPhone`.
O usuário deve informar o cep da organização `cep`.
o usuário deve informar o endereço da organização `address`.
o usuário deve informar o número da organização `number`.
o usuário deve informar o complemento da organização `complement` (opcional).
o usuário deve informar a cidade da organização `city`.
o usuário deve informar o estado da organização `state`.
o usuário deve informar o pais da organização `country`.

Regras:
Puxar Informações automáticas do CNPJ e refletir nos campos `name`, `enterpriseName`, `fantasyName`, `mainEmail`, `mainPhone`, `cep`, `address`, `number`, `complement`, `city`, `state`.
