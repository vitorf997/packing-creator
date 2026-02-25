import React, { useEffect, useMemo, useState } from "react";
import PackingListForm from "./PackingListForm";
import { createPackingList, fetchPackingListById } from "../../../api/packingLists";
import { fetchClients } from "../../../api/clients";
import { fetchSizeMatrixes } from "../../../api/sizeMatrixes";
import { Card, Col, Form, Row } from "react-bootstrap";
import MessageModal from "../../Common/MessageModal";
import styles from "./CreatePackingList.module.css";
import {
  createLabelItem,
  normalizeClientLabelFields,
  normalizeLabelItems
} from "../../../utils/labelFields";
import { openPrintLabelsWindow } from "../PrintLabels/printUtils";
import { openPrintPackingWindow } from "../PrintPacking/printPackingUtils";

// Ecrã para criar um novo Packing
const CreatePackingList = (props) => {
  // Estado do modal de feedback
  const [modal, setModal] = useState({
    show: false,
    title: "",
    message: ""
  });
  const [matrixes, setMatrixes] = useState([]);
  const [selectedMatrixId, setSelectedMatrixId] = useState("");
  const [selectedSizes, setSelectedSizes] = useState(props.data);
  const [clients, setClients] = useState([]);
  const [selectedClientId, setSelectedClientId] = useState("");
  const [po, setPo] = useState("");
  const [model, setModel] = useState("");
  const [labelItems, setLabelItems] = useState([]);
  const [tableLabelItems, setTableLabelItems] = useState([]);
  const [labelItemsDirty, setLabelItemsDirty] = useState(false);
  const [lastCreatedPackingId, setLastCreatedPackingId] = useState("");
  const [printingLastCreated, setPrintingLastCreated] = useState(false);
  const [touched, setTouched] = useState({
    clientId: false,
    sizeMatrixId: false,
    po: false
  });
  const selectedClient = useMemo(
    () => clients.find((client) => client._id === selectedClientId) || null,
    [clients, selectedClientId]
  );
  const clientLabelFields = useMemo(
    () => normalizeClientLabelFields(selectedClient?.labelFields),
    [selectedClient]
  );

  // Fecha o modal
  const closeModal = () => setModal({ show: false, title: "", message: "" });

  // Carrega matrizes de tamanhos
  useEffect(() => {
    fetchSizeMatrixes()
      .then((data) => {
        setMatrixes(data);
      })
      .catch(() => {
        setModal({
          show: true,
          title: "Erro",
          message: "Erro ao carregar matrizes de tamanhos."
        });
      });
  }, []);

  // Carrega clientes
  useEffect(() => {
    fetchClients()
      .then((data) => setClients(data))
      .catch(() => {
        setModal({
          show: true,
          title: "Erro",
          message: "Erro ao carregar clientes."
        });
      });
  }, []);

  // Atualiza tamanhos quando muda a matriz
  useEffect(() => {
    const selected = matrixes.find((m) => m._id === selectedMatrixId);
    if (selected) {
      setSelectedSizes(selected.sizes);
    } else {
      setSelectedSizes(props.data);
    }
  }, [matrixes, selectedMatrixId, props.data]);

  useEffect(() => {
    setLabelItems((prev) => {
      const normalized = normalizeLabelItems(prev, clientLabelFields);
      if (clientLabelFields.length === 0) {
        setTableLabelItems([]);
        setLabelItemsDirty(false);
        return [];
      }
      const baseItems =
        normalized.length > 0 ? normalized : [createLabelItem(clientLabelFields, 0)];
      // Exige ação explícita em "Atualizar Tabela" para concluir o passo de referências.
      setTableLabelItems([]);
      setLabelItemsDirty(true);
      return baseItems;
    });
  }, [clientLabelFields]);

  const applyLabelItemsToTable = () => {
    setTableLabelItems(normalizeLabelItems(labelItems, clientLabelFields));
    setLabelItemsDirty(false);
  };

  // Submete o formulário e grava via API
  const submitHandler = (payload) => {
    if (!po.trim() || !selectedClientId || !selectedMatrixId) {
      setModal({
        show: true,
        title: "Dados inválidos",
        message: "PO, Cliente e Matriz são obrigatórios."
      });
      return;
    }
    createPackingList({
      ...payload,
      po: po.trim(),
      model: model.trim(),
      sizeMatrixId: selectedMatrixId,
      clientId: selectedClientId,
      labelItems: normalizeLabelItems(tableLabelItems, clientLabelFields)
    })
      .then((created) => {
        setLastCreatedPackingId(created?._id || "");
        setModal({
          show: true,
          title: "Sucesso",
          message: "Packing gravado com sucesso."
        });
        setSelectedClientId("");
        setSelectedMatrixId("");
        setPo("");
        setModel("");
        setLabelItems([]);
        setTableLabelItems([]);
        setLabelItemsDirty(false);
      })
      .catch(() => {
        setModal({
          show: true,
          title: "Erro",
          message: "Erro ao gravar o Packing."
        });
      });
  };

  const printLastCreatedLabelsHandler = async () => {
    if (!lastCreatedPackingId) return;
    setPrintingLastCreated(true);
    try {
      const packing = await fetchPackingListById(lastCreatedPackingId);
      await openPrintLabelsWindow(packing);
    } catch (error) {
      setModal({
        show: true,
        title: "Erro",
        message: "Não foi possível imprimir o Packing."
      });
    } finally {
      setPrintingLastCreated(false);
    }
  };

  const printLastCreatedPackingHandler = async () => {
    if (!lastCreatedPackingId) return;
    setPrintingLastCreated(true);
    try {
      const packing = await fetchPackingListById(lastCreatedPackingId);
      await openPrintPackingWindow(packing);
    } catch (error) {
      setModal({
        show: true,
        title: "Erro",
        message: "Não foi possível imprimir o packing."
      });
    } finally {
      setPrintingLastCreated(false);
    }
  };

  const canSubmit =
    po.trim() &&
    selectedClientId &&
    selectedMatrixId &&
    (!clientLabelFields.length || !labelItemsDirty);
  const showErrors = !canSubmit && (touched.clientId || touched.sizeMatrixId || touched.po);
  const baseReady = Boolean(po.trim() && selectedClientId && selectedMatrixId);
  const refsReady = Boolean(
    baseReady &&
      (!clientLabelFields.length || (!labelItemsDirty && tableLabelItems.length > 0))
  );
  const currentStep = !baseReady ? 1 : !refsReady ? 2 : 3;

  return (
    <div className={styles.page}>
      <Card className={styles.stepCard}>
        <div className={styles.stepper}>
          <div
            className={`${styles.step} ${
              baseReady ? styles.stepDone : currentStep === 1 ? styles.stepActive : ""
            }`}
          >
            <span className={styles.stepIndex}>1</span>
            <span>Dados base</span>
          </div>
          <div
            className={`${styles.step} ${
              refsReady ? styles.stepDone : currentStep === 2 ? styles.stepActive : ""
            }`}
          >
            <span className={styles.stepIndex}>2</span>
            <span>Referências</span>
          </div>
          <div
            className={`${styles.step} ${currentStep === 3 ? styles.stepActive : ""}`}
          >
            <span className={styles.stepIndex}>3</span>
            <span>Tabela</span>
          </div>
        </div>
      </Card>

      <Card className={styles.sectionCard}>
        <h3 className={styles.sectionTitle}>Dados da Packing List</h3>
        <Form>
          <Row className="mb-3">
            <Form.Group as={Col} md={12} controlId="clientSelect">
              <Form.Label>Cliente</Form.Label>
              <Form.Select
                value={selectedClientId}
                onChange={(e) => setSelectedClientId(e.target.value)}
                onBlur={() =>
                  setTouched((prev) => ({ ...prev, clientId: true }))
                }
                isInvalid={touched.clientId && !selectedClientId}
              >
                <option value="">-- selecionar cliente --</option>
                {clients.map((c) => (
                  <option key={c._id} value={c._id}>
                    {c.name} {c.code ? `(${c.code})` : ""}
                  </option>
                ))}
              </Form.Select>
              <Form.Control.Feedback type="invalid">
                Cliente é obrigatório.
              </Form.Control.Feedback>
            </Form.Group>
          </Row>
          {!selectedClient ? (
            <div className="mb-3 text-muted">
              Seleciona primeiro o cliente para carregar os campos do rótulo.
            </div>
          ) : null}
          <Row className="mb-3">
            <Form.Group as={Col} md={6} controlId="poInput">
              <Form.Label>PO</Form.Label>
              <Form.Control
                value={po}
                onChange={(e) => setPo(e.target.value)}
                onBlur={() =>
                  setTouched((prev) => ({ ...prev, po: true }))
                }
                isInvalid={touched.po && !po.trim()}
                placeholder="Pedido Original"
              />
              <Form.Control.Feedback type="invalid">
                PO é obrigatório.
              </Form.Control.Feedback>
            </Form.Group>
            <Form.Group as={Col} md={6} controlId="modelInput">
              <Form.Label>Modelo</Form.Label>
              <Form.Control
                value={model}
                onChange={(e) => setModel(e.target.value)}
                placeholder="Modelo"
              />
            </Form.Group>
          </Row>
          <Row className="mb-3">
            <Form.Group as={Col} md={6} controlId="sizeMatrixSelect">
              <Form.Label>Matriz de tamanhos</Form.Label>
              <Form.Select
                value={selectedMatrixId}
                onChange={(e) => setSelectedMatrixId(e.target.value)}
                onBlur={() =>
                  setTouched((prev) => ({ ...prev, sizeMatrixId: true }))
                }
                isInvalid={touched.sizeMatrixId && !selectedMatrixId}
                disabled={!selectedClientId}
              >
                <option value="">-- selecionar matriz --</option>
                {matrixes.map((m) => (
                  <option key={m._id} value={m._id}>
                    {m.name} ({m.sizes.join(", ")})
                  </option>
                ))}
              </Form.Select>
              <Form.Control.Feedback type="invalid">
                Matriz é obrigatória.
              </Form.Control.Feedback>
            </Form.Group>
          </Row>
          {clientLabelFields.length > 0 ? (
            <>
              {labelItems.map((item, itemIndex) => (
                <Row className="mb-2" key={item.itemId}>
                  {item.fields.map((field) => (
                    <Form.Group
                      as={Col}
                      md={Math.max(3, Math.floor(12 / Math.max(1, item.fields.length)))}
                      key={`${item.itemId}_${field.fieldId}`}
                      className="mb-2"
                    >
                      <Form.Label>{field.name}</Form.Label>
                      <Form.Control
                        value={field.value}
                        onChange={(e) =>
                          setLabelItems((prev) => {
                            setLabelItemsDirty(true);
                            return prev.map((row) =>
                              row.itemId !== item.itemId
                                ? row
                                : {
                                    ...row,
                                    fields: row.fields.map((entry) =>
                                      entry.fieldId === field.fieldId
                                        ? { ...entry, value: e.target.value }
                                        : entry
                                    )
                                  }
                            );
                          })
                        }
                        placeholder={field.name}
                        disabled={!selectedClientId}
                      />
                    </Form.Group>
                  ))}
                  <Col md={12} className="mb-2">
                    <button
                      type="button"
                      className="btn btn-outline-danger btn-sm"
                      onClick={() =>
                        setLabelItems((prev) => {
                          setLabelItemsDirty(true);
                          return prev.filter((row) => row.itemId !== item.itemId);
                        })
                      }
                      disabled={labelItems.length <= 1}
                    >
                      Remover linha
                    </button>
                  </Col>
                  {itemIndex < labelItems.length - 1 ? (
                    <Col md={12}>
                      <hr style={{ marginTop: 0 }} />
                    </Col>
                  ) : null}
                </Row>
              ))}
              <div className="mb-3">
                <button
                  type="button"
                  className="btn btn-outline-secondary btn-sm"
                  onClick={() =>
                    setLabelItems((prev) => {
                      setLabelItemsDirty(true);
                      return [
                        ...prev,
                        createLabelItem(clientLabelFields, prev.length)
                      ];
                    })
                  }
                  disabled={!selectedClientId}
                >
                  + Adicionar Referência
                </button>
                <button
                  type="button"
                  className="btn btn-primary btn-sm ms-2"
                  onClick={applyLabelItemsToTable}
                  disabled={!selectedClientId || !selectedMatrixId}
                >
                  Atualizar Tabela
                </button>
              </div>
            </>
          ) : null}
          {labelItemsDirty ? (
            <div className="text-warning mb-2">
              Existem alterações nos campos. Clique em "Atualizar Tabela".
            </div>
          ) : null}
          {showErrors ? (
            <div className="text-danger">Preenche todos os campos obrigatórios.</div>
          ) : null}
        </Form>
      </Card>
      <Card className={styles.sectionCard}>
        <h3 className={styles.sectionTitle}>Tabela de Packing</h3>
        <PackingListForm
          data={selectedSizes}
          onSubmit={submitHandler}
          onInvalid={() =>
            setModal({
              show: true,
              title: "Dados inválidos",
              message:
                "Existem linhas inválidas. Verifique as caixas sobrepostas ou campos obrigatórios."
            })
          }
          submitLabel="Gravar Packing"
          isSubmitDisabled={!canSubmit}
          labelFieldDefs={clientLabelFields}
          labelItems={tableLabelItems}
        />
        <div className="mt-3 d-flex align-items-center gap-2 flex-wrap">
          {lastCreatedPackingId ? (
            <span className="text-muted">Último Packing gravado: {lastCreatedPackingId}</span>
          ) : (
            <span className="text-muted">Grava o Packing para desbloquear a impressão.</span>
          )}
          <button
            type="button"
            className="btn btn-outline-secondary btn-sm"
            onClick={printLastCreatedPackingHandler}
            disabled={!lastCreatedPackingId || printingLastCreated}
          >
            {printingLastCreated ? "A preparar..." : "Imprimir Packing"}
          </button>
          <button
            type="button"
            className="btn btn-outline-dark btn-sm"
            onClick={printLastCreatedLabelsHandler}
            disabled={!lastCreatedPackingId || printingLastCreated}
          >
            {printingLastCreated ? "A preparar..." : "Imprimir Rótulos"}
          </button>
        </div>
      </Card>
      <MessageModal
        show={modal.show}
        title={modal.title}
        message={modal.message}
        onClose={closeModal}
      />
    </div>
  );
};

export default CreatePackingList;
