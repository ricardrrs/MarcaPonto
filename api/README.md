# MarcaPonto API

API HTTP sem dependências externas para desenvolvimento e homologação do sistema MarcaPonto, incluindo autenticação demo, logs e integração REP-C/REP-P.

## Executar localmente

```bash
cd api
cp .env.example .env
npm start
```

A API sobe por padrão em `http://localhost:8080`.

## Credenciais demo

```text
Usuário: admin@marcaponto.local
Senha: admin123
Token: Bearer marcaponto-dev-token
```

## Variáveis de ambiente

| Variável | Padrão | Descrição |
| --- | --- | --- |
| `PORT` | `8080` | Porta HTTP da API. |
| `CORS_ORIGIN` | `http://localhost:3000` | Origem autorizada a consumir a API. |
| `JWT_DEMO_TOKEN` | `Bearer marcaponto-dev-token` | Token aceito nos endpoints protegidos. |

## Endpoints principais

| Método | Endpoint | Autenticação | Descrição |
| --- | --- | --- | --- |
| `GET` | `/health` | Não | Verifica saúde da API. |
| `POST` | `/login` | Não | Autentica usuário demo. |
| `GET` | `/api/v1/auth/usuario` | Sim | Retorna usuário logado. |
| `PATCH` | `/api/v1/auth/password` | Sim | Atualiza senha demo. |
| `GET` | `/api/v1/logs/{colaboradorId}` | Sim | Lista logs por colaborador. |
| `POST` | `/api/v1/logs/{colaboradorId}` | Sim | Registra log manual. |
| `GET` | `/api/v1/rep/equipamentos` | Sim | Lista equipamentos REP. |
| `POST` | `/api/v1/rep/equipamentos` | Sim | Cadastra equipamento REP-C/REP-P. |
| `PUT` | `/api/v1/rep/equipamentos/{id}` | Sim | Atualiza equipamento REP. |
| `DELETE` | `/api/v1/rep/equipamentos/{id}` | Sim | Remove equipamento REP. |
| `POST` | `/api/v1/rep/equipamentos/test/{id}` | Sim | Testa comunicação com equipamento. |
| `POST` | `/api/v1/rep/sincronizar` | Sim | Solicita sincronização REP. |
| `GET` | `/api/v1/rep/sincronizacoes` | Sim | Lista sincronizações solicitadas. |

## Observação

Os dados são persistidos em `api/data/db.json`. Para produção real, substitua esse armazenamento por um banco transacional e implemente autenticação JWT, criptografia de senha, auditoria imutável e conectores oficiais dos fornecedores REP.
