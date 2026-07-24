const fs = require("fs/promises");
const path = require("path");

const databasePath = path.resolve(__dirname, "../data/db.json");

async function readDatabase() {
    const fileContent = await fs.readFile(databasePath, "utf-8");
    return JSON.parse(fileContent);
}

async function writeDatabase(data) {
    await fs.writeFile(databasePath, JSON.stringify(data, null, 2));
    return data;
}

async function nextId(collectionName) {
    const data = await readDatabase();
    const collection = data[collectionName] || [];
    const maxId = collection.reduce((max, item) => Math.max(max, item.id || 0), 0);
    return maxId + 1;
}

module.exports = {
    readDatabase,
    writeDatabase,
    nextId,
};
