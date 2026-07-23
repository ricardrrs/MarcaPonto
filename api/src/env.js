const fs = require("fs");
const path = require("path");

function loadEnv(filePath = path.resolve(__dirname, "../.env")) {
    if (!fs.existsSync(filePath)) return;

    const lines = fs.readFileSync(filePath, "utf-8").split(/\r?\n/);

    lines.forEach((line) => {
        const trimmed = line.trim();

        if (!trimmed || trimmed.startsWith("#")) return;

        const separatorIndex = trimmed.indexOf("=");
        if (separatorIndex === -1) return;

        const key = trimmed.slice(0, separatorIndex).trim();
        const value = trimmed.slice(separatorIndex + 1).trim();

        if (!process.env[key]) {
            process.env[key] = value.replace(/^['\"]|['\"]$/g, "");
        }
    });
}

module.exports = {
    loadEnv,
};
