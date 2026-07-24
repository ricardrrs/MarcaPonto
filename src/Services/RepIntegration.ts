export type RepTipo = "REP-C" | "REP-P";

export type RepStatus = "ATIVO" | "INATIVO" | "SINCRONIZANDO" | "ERRO";

export interface RepDevice {
    id?: number;
    nome: string;
    tipo: RepTipo;
    numeroSerie: string;
    fabricante: string;
    modelo: string;
    endpoint: string;
    certificadoDigital?: string;
    status: RepStatus;
    ultimaSincronizacao?: string;
    observacao?: string;
}

export interface RepSyncRequest {
    equipamentoId: number;
    inicio: string;
    fim: string;
    importarAfd: boolean;
    importarMarcacoes: boolean;
}

export interface RepSyncResult {
    protocolo: string;
    processados: number;
    rejeitados: number;
    mensagem: string;
}

export const defaultRepDevice: RepDevice = {
    nome: "",
    tipo: "REP-C",
    numeroSerie: "",
    fabricante: "",
    modelo: "",
    endpoint: "",
    certificadoDigital: "",
    status: "ATIVO",
    observacao: "",
};

export const repStatusLabels: Record<RepStatus, string> = {
    ATIVO: "Ativo",
    INATIVO: "Inativo",
    SINCRONIZANDO: "Sincronizando",
    ERRO: "Erro",
};

export const repTipoDescriptions: Record<RepTipo, string> = {
    "REP-C": "Equipamento físico certificado para coleta, armazenamento e exportação do AFD.",
    "REP-P": "Registrador por programa para integrações por API, serviço ou arquivo assinado.",
};
