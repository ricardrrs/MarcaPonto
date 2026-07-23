import React, { useContext, useEffect, useState } from "react";
import "./styles.scss";
import HeaderInside from "../../../Components/HeaderInside";
import Card from "../../../Components/Card";
import MainContext from "../../../Contexts/MainContext";
import { showToast } from "../../../Functions";
import {
    deleteRepEquipamento,
    getAllRepEquipamentos,
    insertNewLog,
    insertRepEquipamento,
    syncRepEquipamento,
    testRepEquipamento,
    updateRepEquipamento,
} from "../../../Services/ApiCalls";
import {
    defaultRepDevice,
    RepDevice,
    repStatusLabels,
    RepSyncRequest,
    repTipoDescriptions,
} from "../../../Services/RepIntegration";

const RepIntegracao: React.FC = () => {
    const { token, currentLoggedUserId } = useContext(MainContext);
    const [equipamentos, setEquipamentos] = useState<RepDevice[]>([]);
    const [form, setForm] = useState<RepDevice>(defaultRepDevice);
    const [syncForm, setSyncForm] = useState<RepSyncRequest>({
        equipamentoId: 0,
        inicio: "",
        fim: "",
        importarAfd: true,
        importarMarcacoes: true,
    });
    const [isLoading, setIsLoading] = useState(false);
    const [isSaving, setIsSaving] = useState(false);

    useEffect(() => {
        document.title = "Marca Ponto - Integração REP";
        loadEquipamentos();
    }, []);

    const loadEquipamentos = async () => {
        setIsLoading(true);
        const response: any = await getAllRepEquipamentos(token);

        if (response && response.status === 200) {
            setEquipamentos(response.data);
        }

        setIsLoading(false);
    };

    const resetForm = () => setForm(defaultRepDevice);

    const handleFormChange = (name: keyof RepDevice, value: any) => {
        setForm({ ...form, [name]: value });
    };

    const saveEquipamento = async (event: React.FormEvent) => {
        event.preventDefault();
        setIsSaving(true);

        const response: any = form.id
            ? await updateRepEquipamento(token, form.id, form)
            : await insertRepEquipamento(token, form);

        if (response && (response.status === 200 || response.status === 201)) {
            showToast("SUCCESS", "Equipamento REP salvo com sucesso", {});
            insertNewLog(currentLoggedUserId, `Equipamento ${form.tipo} ${form.numeroSerie} salvo`);
            resetForm();
            await loadEquipamentos();
        } else {
            showToast("ERROR", "Não foi possível salvar o equipamento REP", {});
        }

        setIsSaving(false);
    };

    const removeEquipamento = async (equipamento: RepDevice) => {
        if (!equipamento.id) return;

        const response: any = await deleteRepEquipamento(token, equipamento.id);

        if (response && response.status === 200) {
            showToast("SUCCESS", "Equipamento REP removido", {});
            insertNewLog(currentLoggedUserId, `Equipamento REP ${equipamento.numeroSerie} removido`);
            await loadEquipamentos();
        } else {
            showToast("ERROR", "Não foi possível remover o equipamento REP", {});
        }
    };

    const testConnection = async (equipamento: RepDevice) => {
        if (!equipamento.id) return;

        const response: any = await testRepEquipamento(token, equipamento.id);

        if (response && response.status === 200) {
            showToast("SUCCESS", "Conexão com o REP validada", {});
        } else {
            showToast("ERROR", "Falha ao validar comunicação com o REP", {});
        }
    };

    const syncEquipamento = async (event: React.FormEvent) => {
        event.preventDefault();
        const response: any = await syncRepEquipamento(token, syncForm);

        if (response && (response.status === 200 || response.status === 202)) {
            showToast("SUCCESS", "Sincronização REP enviada para processamento", {});
            insertNewLog(currentLoggedUserId, `Sincronização REP solicitada para equipamento ${syncForm.equipamentoId}`);
        } else {
            showToast("ERROR", "Não foi possível iniciar a sincronização REP", {});
        }
    };

    return (
        <div className="rep__wrapper">
            <div className="usuarios__header">
                <HeaderInside isHome={false} nome={"Integração REP"} />
            </div>
            <div className="page__title-info">
                <div className="tinf__name">
                    <h2 className="tt-title title-blue title-bold">Integração REP-C / REP-P</h2>
                    <p>Cadastre relógios eletrônicos de ponto e sincronize marcações oficiais.</p>
                </div>
            </div>

            <div className="rep__grid">
                <Card>
                    <h3 className="tt-sub title-blue title-bold">Equipamento</h3>
                    <form className="rep__form" onSubmit={saveEquipamento}>
                        <label>Nome<input required value={form.nome} onChange={(e) => handleFormChange("nome", e.target.value)} /></label>
                        <label>Tipo<select value={form.tipo} onChange={(e) => handleFormChange("tipo", e.target.value)}><option value="REP-C">REP-C</option><option value="REP-P">REP-P</option></select></label>
                        <p className="rep__hint">{repTipoDescriptions[form.tipo]}</p>
                        <label>Número de série<input required value={form.numeroSerie} onChange={(e) => handleFormChange("numeroSerie", e.target.value)} /></label>
                        <label>Fabricante<input required value={form.fabricante} onChange={(e) => handleFormChange("fabricante", e.target.value)} /></label>
                        <label>Modelo<input required value={form.modelo} onChange={(e) => handleFormChange("modelo", e.target.value)} /></label>
                        <label>Endpoint/API/IP<input required value={form.endpoint} onChange={(e) => handleFormChange("endpoint", e.target.value)} placeholder="https://rep.empresa.com.br/api ou 192.168.0.10" /></label>
                        <label>Certificado digital / token<textarea value={form.certificadoDigital} onChange={(e) => handleFormChange("certificadoDigital", e.target.value)} /></label>
                        <label>Status<select value={form.status} onChange={(e) => handleFormChange("status", e.target.value)}><option value="ATIVO">Ativo</option><option value="INATIVO">Inativo</option></select></label>
                        <label>Observação<textarea value={form.observacao} onChange={(e) => handleFormChange("observacao", e.target.value)} /></label>
                        <div className="rep__actions"><button className="bt form__login" type="submit" disabled={isSaving}>{isSaving ? "Salvando..." : "Salvar"}</button><button className="bt" type="button" onClick={resetForm}>Limpar</button></div>
                    </form>
                </Card>

                <Card>
                    <h3 className="tt-sub title-blue title-bold">Sincronizar marcações</h3>
                    <form className="rep__form" onSubmit={syncEquipamento}>
                        <label>Equipamento<select required value={syncForm.equipamentoId} onChange={(e) => setSyncForm({ ...syncForm, equipamentoId: Number(e.target.value) })}><option value={0}>Selecione</option>{equipamentos.map((e) => <option key={e.id} value={e.id}>{e.nome} - {e.numeroSerie}</option>)}</select></label>
                        <label>Início<input type="datetime-local" required value={syncForm.inicio} onChange={(e) => setSyncForm({ ...syncForm, inicio: e.target.value })} /></label>
                        <label>Fim<input type="datetime-local" required value={syncForm.fim} onChange={(e) => setSyncForm({ ...syncForm, fim: e.target.value })} /></label>
                        <label className="rep__check"><input type="checkbox" checked={syncForm.importarAfd} onChange={(e) => setSyncForm({ ...syncForm, importarAfd: e.target.checked })} /> Importar AFD</label>
                        <label className="rep__check"><input type="checkbox" checked={syncForm.importarMarcacoes} onChange={(e) => setSyncForm({ ...syncForm, importarMarcacoes: e.target.checked })} /> Importar marcações</label>
                        <button className="bt form__login" type="submit">Sincronizar</button>
                    </form>
                </Card>
            </div>

            <Card>
                <h3 className="tt-sub title-blue title-bold">Equipamentos cadastrados</h3>
                {isLoading ? <p>Carregando equipamentos...</p> : equipamentos.length === 0 ? <p>Nenhum REP cadastrado.</p> : (
                    <div className="rep__list">
                        {equipamentos.map((equipamento) => (
                            <div className="rep__item" key={equipamento.id || equipamento.numeroSerie}>
                                <div><strong>{equipamento.nome}</strong><span>{equipamento.tipo} • {equipamento.fabricante} {equipamento.modelo}</span><span>Série: {equipamento.numeroSerie}</span><span>Status: {repStatusLabels[equipamento.status]}</span></div>
                                <div className="rep__actions"><button className="bt" type="button" onClick={() => setForm(equipamento)}>Editar</button><button className="bt" type="button" onClick={() => testConnection(equipamento)}>Testar</button><button className="bt" type="button" onClick={() => removeEquipamento(equipamento)}>Remover</button></div>
                            </div>
                        ))}
                    </div>
                )}
            </Card>
        </div>
    );
};

export default RepIntegracao;
