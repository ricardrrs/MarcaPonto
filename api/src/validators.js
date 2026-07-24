const repTypes = ["REP-C", "REP-P"];
const repStatuses = ["ATIVO", "INATIVO", "SINCRONIZANDO", "ERRO"];

function validateRepDevice(payload) {
    const errors = [];

    if (!payload.nome) errors.push("Nome é obrigatório");
    if (!repTypes.includes(payload.tipo)) errors.push("Tipo deve ser REP-C ou REP-P");
    if (!payload.numeroSerie) errors.push("Número de série é obrigatório");
    if (!payload.fabricante) errors.push("Fabricante é obrigatório");
    if (!payload.modelo) errors.push("Modelo é obrigatório");
    if (!payload.endpoint) errors.push("Endpoint/API/IP é obrigatório");
    if (payload.status && !repStatuses.includes(payload.status)) {
        errors.push("Status inválido");
    }

    return errors;
}

function validateSyncRequest(payload) {
    const errors = [];

    if (!payload.equipamentoId || Number.isNaN(Number(payload.equipamentoId))) {
        errors.push("Equipamento é obrigatório");
    }

    if (!payload.inicio) errors.push("Data/hora de início é obrigatória");
    if (!payload.fim) errors.push("Data/hora de fim é obrigatória");

    if (payload.inicio && payload.fim && new Date(payload.inicio) > new Date(payload.fim)) {
        errors.push("Início não pode ser maior que fim");
    }

    if (!payload.importarAfd && !payload.importarMarcacoes) {
        errors.push("Selecione AFD, marcações ou ambos para importar");
    }

    return errors;
}

module.exports = {
    validateRepDevice,
    validateSyncRequest,
};
