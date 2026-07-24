const { loadEnv } = require("./env");
loadEnv();

const crypto = require("crypto");
const http = require("http");
const { URL } = require("url");

const { authMiddleware, normalizeToken } = require("./auth");
const { nextId, readDatabase, writeDatabase } = require("./database");
const { validateRepDevice, validateSyncRequest } = require("./validators");

const port = Number(process.env.PORT || 8080);
const corsOrigin = process.env.CORS_ORIGIN || "http://localhost:3000";

function sendJson(res, statusCode, payload) {
    res.writeHead(statusCode, {
        "Content-Type": "application/json; charset=utf-8",
        "Access-Control-Allow-Origin": corsOrigin,
        "Access-Control-Allow-Headers": "Content-Type, Authorization",
        "Access-Control-Allow-Methods": "GET,POST,PUT,PATCH,DELETE,OPTIONS",
    });
    res.end(JSON.stringify(payload));
}

function parseBody(req) {
    return new Promise((resolve, reject) => {
        let body = "";

        req.on("data", (chunk) => {
            body += chunk;

            if (body.length > 2 * 1024 * 1024) {
                reject(new Error("Payload excede o limite de 2MB"));
                req.destroy();
            }
        });

        req.on("end", () => {
            if (!body) return resolve({});

            const contentType = req.headers["content-type"] || "";

            if (contentType.includes("text/plain")) {
                return resolve(body);
            }

            try {
                return resolve(JSON.parse(body));
            } catch (error) {
                return reject(new Error("JSON inválido"));
            }
        });
    });
}

function createReqContext(req, body) {
    const url = new URL(req.url, `http://${req.headers.host}`);
    return {
        method: req.method,
        pathname: url.pathname,
        params: {},
        query: Object.fromEntries(url.searchParams.entries()),
        headers: req.headers,
        body,
    };
}

function matchRoute(method, pattern, reqMethod, pathname) {
    if (method !== reqMethod) return null;

    const patternParts = pattern.split("/").filter(Boolean);
    const pathParts = pathname.split("/").filter(Boolean);

    if (patternParts.length !== pathParts.length) return null;

    const params = {};

    for (let index = 0; index < patternParts.length; index += 1) {
        const patternPart = patternParts[index];
        const pathPart = pathParts[index];

        if (patternPart.startsWith(":")) {
            params[patternPart.slice(1)] = pathPart;
            continue;
        }

        if (patternPart !== pathPart) return null;
    }

    return params;
}

async function addLog(content, colaboradorId = 1) {
    const data = await readDatabase();
    const log = {
        id: await nextId("logs"),
        colaboradorId,
        content,
        date: new Date().toISOString(),
    };

    data.logs.push(log);
    await writeDatabase(data);
    return log;
}

function requireAuth(ctx) {
    return authMiddleware(ctx);
}

const routes = [];
function route(method, pattern, handler) {
    routes.push({ method, pattern, handler });
}

route("GET", "/health", async () => ({
    statusCode: 200,
    payload: { status: "UP", service: "marcaponto-api", timestamp: new Date().toISOString() },
}));

route("POST", "/login", async (ctx) => {
    const { email, username, password } = ctx.body || {};
    const data = await readDatabase();
    const user = data.usuarios.find(
        (usuario) =>
            (usuario.email === email || usuario.username === username) &&
            usuario.password === password
    );

    if (!user) {
        return { statusCode: 401, payload: { message: "Usuário ou senha inválidos" } };
    }

    return {
        statusCode: 200,
        payload: {
            token: normalizeToken(process.env.JWT_DEMO_TOKEN || "Bearer marcaponto-dev-token"),
            type: "Bearer",
            username: user.username,
            colaboradorId: user.colaboradorId,
            perfis: user.perfis,
        },
    };
});

route("GET", "/api/v1/auth/usuario", async (ctx) => {
    requireAuth(ctx);
    const data = await readDatabase();
    const user = data.usuarios[0];

    return {
        statusCode: 200,
        payload: {
            username: user.username,
            colaboradorId: user.colaboradorId,
            perfis: user.perfis,
        },
    };
});

route("PATCH", "/api/v1/auth/password", async (ctx) => {
    requireAuth(ctx);
    const newPassword = typeof ctx.body === "string" ? ctx.body : ctx.body.password;

    if (!newPassword || newPassword.length < 10) {
        return { statusCode: 400, payload: { message: "Senha deve conter pelo menos 10 caracteres" } };
    }

    const data = await readDatabase();
    data.usuarios[0].password = newPassword;
    await writeDatabase(data);
    await addLog("Senha alterada", data.usuarios[0].colaboradorId);

    return { statusCode: 200, payload: { message: "Senha alterada com sucesso" } };
});

route("GET", "/api/v1/logs/:colaboradorId", async (ctx) => {
    requireAuth(ctx);
    const data = await readDatabase();
    const colaboradorId = Number(ctx.params.colaboradorId);

    return {
        statusCode: 200,
        payload: data.logs.filter((log) => log.colaboradorId === colaboradorId),
    };
});

route("POST", "/api/v1/logs/:colaboradorId", async (ctx) => {
    requireAuth(ctx);
    const log = await addLog(ctx.body.content || "Ação registrada", Number(ctx.params.colaboradorId));
    return { statusCode: 201, payload: log };
});

route("GET", "/api/v1/rep/equipamentos", async (ctx) => {
    requireAuth(ctx);
    const data = await readDatabase();
    return { statusCode: 200, payload: data.repEquipamentos };
});

route("POST", "/api/v1/rep/equipamentos", async (ctx) => {
    requireAuth(ctx);
    const errors = validateRepDevice(ctx.body);

    if (errors.length) {
        return { statusCode: 400, payload: { message: "Dados inválidos", errors } };
    }

    const data = await readDatabase();
    const equipamento = {
        id: await nextId("repEquipamentos"),
        nome: ctx.body.nome,
        tipo: ctx.body.tipo,
        numeroSerie: ctx.body.numeroSerie,
        fabricante: ctx.body.fabricante,
        modelo: ctx.body.modelo,
        endpoint: ctx.body.endpoint,
        certificadoDigital: ctx.body.certificadoDigital || "",
        status: ctx.body.status || "ATIVO",
        ultimaSincronizacao: null,
        observacao: ctx.body.observacao || "",
        criadoEm: new Date().toISOString(),
        atualizadoEm: new Date().toISOString(),
    };

    data.repEquipamentos.push(equipamento);
    await writeDatabase(data);
    await addLog(`Equipamento ${equipamento.tipo} ${equipamento.numeroSerie} cadastrado`);

    return { statusCode: 201, payload: equipamento };
});

route("PUT", "/api/v1/rep/equipamentos/:id", async (ctx) => {
    requireAuth(ctx);
    const errors = validateRepDevice(ctx.body);

    if (errors.length) {
        return { statusCode: 400, payload: { message: "Dados inválidos", errors } };
    }

    const data = await readDatabase();
    const id = Number(ctx.params.id);
    const index = data.repEquipamentos.findIndex((equipamento) => equipamento.id === id);

    if (index === -1) {
        return { statusCode: 404, payload: { message: "Equipamento REP não encontrado" } };
    }

    data.repEquipamentos[index] = {
        ...data.repEquipamentos[index],
        ...ctx.body,
        id,
        atualizadoEm: new Date().toISOString(),
    };

    await writeDatabase(data);
    await addLog(`Equipamento REP ${data.repEquipamentos[index].numeroSerie} atualizado`);

    return { statusCode: 200, payload: data.repEquipamentos[index] };
});

route("DELETE", "/api/v1/rep/equipamentos/:id", async (ctx) => {
    requireAuth(ctx);
    const data = await readDatabase();
    const id = Number(ctx.params.id);
    const equipamento = data.repEquipamentos.find((item) => item.id === id);

    if (!equipamento) {
        return { statusCode: 404, payload: { message: "Equipamento REP não encontrado" } };
    }

    data.repEquipamentos = data.repEquipamentos.filter((item) => item.id !== id);
    await writeDatabase(data);
    await addLog(`Equipamento REP ${equipamento.numeroSerie} removido`);

    return { statusCode: 200, payload: { message: "Equipamento removido com sucesso" } };
});

route("POST", "/api/v1/rep/equipamentos/test/:id", async (ctx) => {
    requireAuth(ctx);
    const data = await readDatabase();
    const equipamento = data.repEquipamentos.find((item) => item.id === Number(ctx.params.id));

    if (!equipamento) {
        return { statusCode: 404, payload: { message: "Equipamento REP não encontrado" } };
    }

    if (equipamento.status !== "ATIVO") {
        return { statusCode: 409, payload: { message: "Equipamento não está ativo" } };
    }

    await addLog(`Comunicação testada com REP ${equipamento.numeroSerie}`);

    return {
        statusCode: 200,
        payload: {
            status: "OK",
            message: "Comunicação validada com sucesso",
            endpoint: equipamento.endpoint,
            checkedAt: new Date().toISOString(),
        },
    };
});

route("POST", "/api/v1/rep/sincronizar", async (ctx) => {
    requireAuth(ctx);
    const errors = validateSyncRequest(ctx.body);

    if (errors.length) {
        return { statusCode: 400, payload: { message: "Dados inválidos", errors } };
    }

    const data = await readDatabase();
    const equipamento = data.repEquipamentos.find(
        (item) => item.id === Number(ctx.body.equipamentoId)
    );

    if (!equipamento) {
        return { statusCode: 404, payload: { message: "Equipamento REP não encontrado" } };
    }

    const sincronizacao = {
        id: await nextId("repSincronizacoes"),
        protocolo: crypto.randomUUID(),
        equipamentoId: equipamento.id,
        inicio: ctx.body.inicio,
        fim: ctx.body.fim,
        importarAfd: Boolean(ctx.body.importarAfd),
        importarMarcacoes: Boolean(ctx.body.importarMarcacoes),
        status: "PROCESSADO",
        processados: 0,
        rejeitados: 0,
        mensagem: "Solicitação de sincronização registrada para processamento",
        criadoEm: new Date().toISOString(),
    };

    data.repSincronizacoes.push(sincronizacao);
    data.repEquipamentos = data.repEquipamentos.map((item) =>
        item.id === equipamento.id
            ? { ...item, ultimaSincronizacao: sincronizacao.criadoEm }
            : item
    );

    await writeDatabase(data);
    await addLog(`Sincronização REP solicitada para equipamento ${equipamento.numeroSerie}`);

    return { statusCode: 202, payload: sincronizacao };
});

route("GET", "/api/v1/rep/sincronizacoes", async (ctx) => {
    requireAuth(ctx);
    const data = await readDatabase();
    return { statusCode: 200, payload: data.repSincronizacoes };
});

const server = http.createServer(async (req, res) => {
    if (req.method === "OPTIONS") {
        return sendJson(res, 204, {});
    }

    try {
        const body = await parseBody(req);
        const ctx = createReqContext(req, body);

        for (const registeredRoute of routes) {
            const params = matchRoute(
                registeredRoute.method,
                registeredRoute.pattern,
                ctx.method,
                ctx.pathname
            );

            if (params) {
                ctx.params = params;
                const response = await registeredRoute.handler(ctx);
                return sendJson(res, response.statusCode, response.payload);
            }
        }

        return sendJson(res, 404, { message: "Recurso não encontrado" });
    } catch (error) {
        if (error.statusCode) {
            return sendJson(res, error.statusCode, { message: error.message });
        }

        console.error(error);
        return sendJson(res, 500, { message: "Erro interno do servidor" });
    }
});

server.listen(port, () => {
    console.log(`MarcaPonto API listening on port ${port}`);
});
