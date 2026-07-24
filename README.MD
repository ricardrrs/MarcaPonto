![enter image description here](https://i.imgur.com/vv80AvH.png)

![MarcaPonto](https://i.imgur.com/24xg3xD.jpg)

# Controle de ponto online

MarcaPonto é um sistema de gerenciamento de jornada inteligente, totalmente online e de fácil acesso.

## Justificativa

O custo de regularizar sistemas de ponto pode se tornar complexo ou até mesmo inviável, pois além da empresa ter que adquirir equipamentos específicos, também precisa disponibilizar alguém para gerir e realizar manutenções periódicas. Em muitos casos o “não fazer” também pode acarretar grandes problemas, já que questões como segurança perdem o foco sem um serviço específico. Nosso sistema será de baixo custo, acessível e seguro, dentro de todas as leis cabíveis e prezando pela entrega de qualidade.

## Tecnologias

-   React
-   SASS
-   Typescript
-   React Leaflet
-   Lottie
-   Rechart

# Funcionalidades

![Dashboard](https://i.imgur.com/MhxrgUj.png)

Os usuários possuem 2 níveis, **Colaboradores** e **Gestores**. Os colaboradores podem bater ponto e consultar seu espelho de ponto, o gestor pode fazer o cadastro de usuários, expedientes, funções, setores, e horários, além de poder aprovar pontos e fazer delimitações de onde o usuário pode bater o ponto.

## Usuários

Os usuários cadastrados receberão uma senha em seu e-mail para fazer o acesso no sistema, Após fazer o acesso, o mesmo poderá atualizar essa senha na página de configurações.

![Usuários Cadastrados](https://i.imgur.com/pqU7NFE.png)

![Atualiza usuários](https://i.imgur.com/0v6iI4H.png)

![Delimitar pontos](https://i.imgur.com/O2xnwgV.png)

Nesse exemplo, o usuário Heitor Augusto só poderá bater o ponto dentro da área delimitada em azul. O gestor tem a habilidade de adicionar várias áreas para um mesmo usuário, além de aumentar o raio dessa área, trocar essa área de lugar e deletar a mesma.

## Pontos

O gestor pode realizar a aprovação e a reprovação de pontos.

![Aprovar pontos](https://i.imgur.com/Mi2Ztbj.png)

## Espelho do ponto

![Espelho do ponto](https://i.imgur.com/nbijNIF.png)

## Relatórios

O gestor pode gerar relatórios de todos os itens cadastrados juntamente com os logs de atividades.

![Relatórios](https://i.imgur.com/b3QnVPp.png)

## Logs

Todas as ações feitas pelos usuários são salvas na sessão de logs, onde a mesma diz o que foi feito e em qual horário.

![Logs](https://i.imgur.com/42nIPQj.png)

Juntamente com os logs, o usuário tem a opção de ver essas mudanças em um sistema de notificações.

## Configurações

No menu de configurações o usuário pode atualizar sua senha e trocar a linguagem do sistema. Os idiomas disponíveis são **Português**, **Inglês**, **Espanhol** e **Italiano**.

![Configurações](https://i.imgur.com/Iqd6xnt.png)


# Passo a passo de instalação e implementação

Este guia descreve como preparar o ambiente, executar o sistema localmente, publicar em produção e habilitar a integração com relógios de ponto eletrônico REP-C e REP-P.

## 1. Pré-requisitos

Antes de iniciar, instale e valide os itens abaixo:

1. **Node.js 14.x**: a aplicação usa `react-scripts@3.4.3` e `node-sass@4.14.1`, portanto o runtime recomendado é Node 14 para evitar incompatibilidades de build.
2. **npm** compatível com o Node 14.
3. **Git** para clonar o repositório.
4. **Docker** apenas se a implantação for feita por container.
5. **API MarcaPonto** disponível e acessível pela aplicação web.
6. Para integração REP-C/REP-P, valide com o fornecedor do relógio:
    - URL, IP ou endpoint de comunicação do equipamento/serviço.
    - Número de série, fabricante e modelo.
    - Credenciais, token ou certificado digital quando exigido.
    - Permissão de rede entre a API MarcaPonto e o equipamento ou serviço REP.

## 2. Instalação local

Clone o projeto e instale as dependências:

```bash
git clone <url-do-repositorio>
cd MarcaPonto
npm ci
```

Crie o arquivo de ambiente a partir do exemplo:

```bash
cp .env.example .env
```

Edite a variável `REACT_APP_API_BASE_URL` para apontar para a API desejada:

```env
REACT_APP_API_BASE_URL=http://localhost:8080
```

Inicie a aplicação em modo de desenvolvimento:

```bash
npm start
```

Acesse a interface no navegador em `http://localhost:3000`.

## 3. Build de produção

Para gerar os arquivos estáticos de produção, use Node 14 e execute:

```bash
npm ci
npm run build
```

O resultado será gerado no diretório `build/`. Esses arquivos podem ser publicados em um servidor web estático com fallback para `index.html`, pois o roteamento é feito no navegador.

## 4. Publicação com Docker e Nginx

O projeto contém um `Dockerfile` multi-stage que compila a aplicação e publica o diretório `build/` em Nginx.

Monte a imagem informando a URL pública da API:

```bash
docker build \
  --build-arg REACT_APP_API_BASE_URL=https://api.seu-dominio.com.br \
  -t marcaponto-web:latest .
```

Execute o container:

```bash
docker run -d \
  --name marcaponto-web \
  -p 80:80 \
  marcaponto-web:latest
```

Depois da subida, acesse `http://<servidor>` e valide login, navegação do dashboard e chamadas para a API.

## 5. Configuração mínima da API

A aplicação web espera que a API disponibilize autenticação, cadastros, pontos, logs e os endpoints de integração REP. Para o módulo REP-C/REP-P, a API deve expor:

| Método | Endpoint | Finalidade |
| --- | --- | --- |
| `GET` | `/api/v1/rep/equipamentos` | Listar equipamentos REP cadastrados. |
| `POST` | `/api/v1/rep/equipamentos` | Cadastrar equipamento REP-C ou REP-P. |
| `PUT` | `/api/v1/rep/equipamentos/{id}` | Atualizar cadastro de equipamento. |
| `DELETE` | `/api/v1/rep/equipamentos/{id}` | Remover equipamento. |
| `POST` | `/api/v1/rep/equipamentos/test/{id}` | Testar comunicação com equipamento ou serviço REP. |
| `POST` | `/api/v1/rep/sincronizar` | Solicitar importação de AFD e/ou marcações. |

Todos os endpoints protegidos devem aceitar o cabeçalho `Authorization` com o token do usuário autenticado.

## 6. Implementação da integração REP-C/REP-P

Siga o fluxo abaixo para habilitar um relógio eletrônico de ponto:

1. Faça login com um usuário **Administrador** ou **Gestor**.
2. No menu lateral, acesse **Relatórios > Integração REP**.
3. Em **Equipamento**, preencha:
    - **Nome**: identificação amigável, por exemplo `REP Portaria 01`.
    - **Tipo**: selecione `REP-C` para equipamento físico certificado ou `REP-P` para registrador por programa/API.
    - **Número de série**: número oficial do equipamento/serviço.
    - **Fabricante** e **Modelo**.
    - **Endpoint/API/IP**: endereço usado pela API para comunicação.
    - **Certificado digital / token**: informe somente quando o fornecedor exigir.
    - **Status**: mantenha como `Ativo` para permitir sincronização.
4. Clique em **Salvar**.
5. Na lista de equipamentos cadastrados, clique em **Testar** para validar a comunicação.
6. Em **Sincronizar marcações**, selecione o equipamento, informe período de início/fim e escolha se deseja importar AFD, marcações ou ambos.
7. Clique em **Sincronizar**.
8. Acompanhe a importação pelos logs do sistema e pelos retornos da API.

## 7. Validação pós-implantação

Após instalar ou atualizar o sistema, execute a lista de conferência:

1. Login e renovação de sessão funcionando.
2. Dashboard abrindo sem erros no console do navegador.
3. Variável `REACT_APP_API_BASE_URL` apontando para a API correta.
4. Menu **Integração REP** visível para Gestor/Administrador.
5. Cadastro, teste de conexão e sincronização REP retornando sucesso ou mensagens tratadas.
6. Logs registrando ações de cadastro, remoção e sincronização.
7. Roteamento direto funcionando, por exemplo `/dashboard/rep-integracao`, sem erro 404 no Nginx.

## 8. Observações de produção

- Use HTTPS no domínio da aplicação e no domínio da API.
- Restrinja CORS na API para o domínio público da aplicação.
- Não exponha certificados digitais, tokens de REP ou credenciais em repositórios Git.
- Faça backup periódico dos registros de ponto, logs e arquivos AFD importados.
- Valide regras trabalhistas e requisitos legais aplicáveis ao ambiente antes de ativar o uso em produção.

## 9. API de desenvolvimento incluída

O repositório também contém uma API em `api/` para servir o sistema em desenvolvimento e homologação. Ela disponibiliza autenticação demo, logs e endpoints REP-C/REP-P compatíveis com a interface web.

Para executar:

```bash
cd api
cp .env.example .env
npm start
```

Configure a aplicação web para consumir essa API local:

```env
REACT_APP_API_BASE_URL=http://localhost:8080
```

Credenciais demo:

```text
Usuário: admin@marcaponto.local
Senha: admin123
Token aceito nos endpoints protegidos: Bearer marcaponto-dev-token
```

A API usa `api/data/db.json` como armazenamento local. Em produção, substitua esse arquivo por um banco de dados transacional e implemente autenticação JWT, criptografia de senhas, auditoria imutável e conectores certificados dos fornecedores REP.
