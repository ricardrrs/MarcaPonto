function normalizeToken(value) {
    if (!value) return "";
    return value.startsWith("Bearer ") ? value : `Bearer ${value}`;
}

function authMiddleware(ctx) {
    const expectedToken = normalizeToken(process.env.JWT_DEMO_TOKEN || "Bearer marcaponto-dev-token");
    const receivedToken = normalizeToken(ctx.headers.authorization);

    if (!receivedToken || receivedToken !== expectedToken) {
        const error = new Error("Token inválido ou ausente");
        error.statusCode = 401;
        throw error;
    }

    ctx.auth = {
        token: receivedToken,
    };
}

module.exports = {
    authMiddleware,
    normalizeToken,
};
