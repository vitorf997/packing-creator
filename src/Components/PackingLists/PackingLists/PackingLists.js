import React, { useEffect, useState } from "react";
import { Button, Form, Modal, Table } from "react-bootstrap";
import {
  deletePackingList,
  fetchPackingLists,
  updatePackingList
} from "../../../api/packingLists";
import ConfirmModal from "../../Common/ConfirmModal";
import MessageModal from "../../Common/MessageModal";
import PackingListForm from "../CreatePackingList/PackingListForm";
import { fetchClients } from "../../../api/clients";
import { fetchSizeMatrixes } from "../../../api/sizeMatrixes";
import { openPrintLabelsWindow } from "../PrintLabels/printUtils";
import {
  createLabelItem,
  normalizeClientLabelFields,
  normalizeLabelItems
} from "../../../utils/labelFields";

// Listagem de packing lists com edição inline de notas
const PackingLists = () => {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(false);
  const [editingId, setEditingId] = useState("");
  const [draftNotes, setDraftNotes] = useState("");
  const [confirm, setConfirm] = useState({ show: false, id: "" });
  const [editItem, setEditItem] = useState(null);
  const [search, setSearch] = useState("");
  const [filterClientId, setFilterClientId] = useState("");
  const [filterMatrixId, setFilterMatrixId] = useState("");
  const [clients, setClients] = useState([]);
  const [matrixes, setMatrixes] = useState([]);
  // Estado do modal de feedback
  const [modal, setModal] = useState({
    show: false,
    title: "",
    message: ""
  });

  // Fecha o modal
  const closeModal = () => setModal({ show: false, title: "", message: "" });

  // Carrega listas do backend
  const loadItems = (query, clientId, matrixId) => {
    setLoading(true);
    fetchPackingLists({
      ...(query ? { q: query } : {}),
      ...(clientId ? { clientId } : {}),
      ...(matrixId ? { sizeMatrixId: matrixId } : {})
    })
      .then((data) => {
        setItems(data);
      })
      .catch(() => {
        setModal({
          show: true,
          title: "Erro",
          message: "Erro ao carregar packing lists."
        });
      })
      .finally(() => setLoading(false));
  };

  // Carrega ao montar
  useEffect(() => {
    loadItems();
  }, []);

  // Pesquisa com debounce
  useEffect(() => {
    const handle = setTimeout(() => {
      loadItems(search.trim(), filterClientId, filterMatrixId);
    }, 300);
    return () => clearTimeout(handle);
  }, [search, filterClientId, filterMatrixId]);

  // Carrega clientes e matrizes para edição
  useEffect(() => {
    fetchClients().then(setClients).catch(() => {});
    fetchSizeMatrixes().then(setMatrixes).catch(() => {});
  }, []);

  // Inicia edição inline
  const startEdit = (item) => {
    setEditingId(item._id);
    setDraftNotes(item.notes || "");
  };

  // Cancela a edição inline
  const cancelEdit = () => {
    setEditingId("");
    setDraftNotes("");
  };

  // Guarda alterações da linha (notas)
  const saveEdit = (item) => {
    updatePackingList(item._id, {
      po: item.po,
      model: item.model,
      clientId: item.clientId?._id || item.clientId,
      sizeMatrixId: item.sizeMatrixId?._id || item.sizeMatrixId,
      sizeMatrix: item.sizeMatrix,
      labelItems: normalizeLabelItems(
        item.labelItems,
        normalizeClientLabelFields(item.clientId?.labelFields)
      ),
      entries: item.entries,
      totalUnits: item.totalUnits,
      notes: draftNotes
    })
      .then((updated) => {
        setItems((prev) =>
          prev.map((row) => (row._id === updated._id ? updated : row))
        );
        setEditingId("");
        setDraftNotes("");
      })
      .catch(() => {
        setModal({
          show: true,
          title: "Erro",
          message: "Erro ao atualizar packing list."
        });
      });
  };

  // Abre modal de edição de itens
  const openEdit = (item) => {
    const clientId = item.clientId?._id || item.clientId || "";
    const selectedClient = clients.find((client) => client._id === clientId);
    const clientFields = normalizeClientLabelFields(
      selectedClient?.labelFields || item.clientId?.labelFields
    );
    const items = normalizeLabelItems(item.labelItems, clientFields);
    setEditItem({
      ...item,
      labelItems:
        items.length > 0
          ? items
          : clientFields.length > 0
            ? [createLabelItem(clientFields, 0)]
            : []
    });
  };

  // Fecha modal de edição de itens
  const closeEdit = () => {
    setEditItem(null);
  };

  // Guarda alterações dos itens da packing list
  const saveEditItems = (payload) => {
    if (!editItem?._id) return;
    if (!editItem.clientId?._id || !editItem.sizeMatrixId?._id) {
      setModal({
        show: true,
        title: "Dados inválidos",
        message: "Cliente e Matriz são obrigatórios."
      });
      return;
    }
    updatePackingList(editItem._id, payload)
      .then((updated) => {
        setItems((prev) =>
          prev.map((row) => (row._id === updated._id ? updated : row))
        );
        setEditItem(null);
      })
      .catch(() => {
        setModal({
          show: true,
          title: "Erro",
          message: "Erro ao atualizar packing list."
        });
      });
  };

  // Abre modal de confirmação
  const requestDelete = (id) => {
    setConfirm({ show: true, id });
  };

  // Confirma remoção no backend
  const confirmDelete = () => {
    const id = confirm.id;
    setConfirm({ show: false, id: "" });
    deletePackingList(id)
      .then(() => {
        setItems((prev) => prev.filter((item) => item._id !== id));
      })
      .catch(() => {
        setModal({
          show: true,
          title: "Erro",
          message: "Erro ao remover packing list."
        });
      });
  };

  return (
    <div>
      <h3>Packing Lists</h3>
      <div style={{ display: "flex", gap: "12px", marginBottom: "12px" }}>
        <Form.Control
          placeholder="Pesquisar por cliente/notas..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          style={{ maxWidth: "320px" }}
        />
        <Form.Select
          value={filterClientId}
          onChange={(e) => setFilterClientId(e.target.value)}
          style={{ maxWidth: "220px" }}
        >
          <option value="">Cliente: todos</option>
          {clients.map((c) => (
            <option key={c._id} value={c._id}>
              {c.name}
            </option>
          ))}
        </Form.Select>
        <Form.Select
          value={filterMatrixId}
          onChange={(e) => setFilterMatrixId(e.target.value)}
          style={{ maxWidth: "220px" }}
        >
          <option value="">Matriz: todas</option>
          {matrixes.map((m) => (
            <option key={m._id} value={m._id}>
              {m.name}
            </option>
          ))}
        </Form.Select>
        <Button
          onClick={() => loadItems(search.trim(), filterClientId, filterMatrixId)}
          disabled={loading}
          variant="outline-primary"
        >
          {loading ? "A carregar..." : "Recarregar"}
        </Button>
      </div>
      {(search || filterClientId || filterMatrixId) && (
        <div style={{ marginBottom: "12px", display: "flex", gap: "8px" }}>
          {search && (
            <span className="badge bg-secondary">Pesquisa: {search}</span>
          )}
          {filterClientId && (
            <span className="badge bg-info">
              Cliente: {clients.find((c) => c._id === filterClientId)?.name || "-"}
            </span>
          )}
          {filterMatrixId && (
            <span className="badge bg-info">
              Matriz: {matrixes.find((m) => m._id === filterMatrixId)?.name || "-"}
            </span>
          )}
          <Button
            size="sm"
            variant="outline-secondary"
            onClick={() => {
              setSearch("");
              setFilterClientId("");
              setFilterMatrixId("");
            }}
          >
            Limpar filtros
          </Button>
        </div>
      )}
      {items.length === 0 ? (
        <p style={{ marginTop: "12px" }}>Sem resultados.</p>
      ) : (
        <Table striped bordered hover responsive style={{ marginTop: "12px" }}>
          <thead className="table-dark">
            <tr>
              <th>ID</th>
              <th>Cliente</th>
              <th>Matriz</th>
              <th>Total</th>
              <th>Criada</th>
              <th>Notas</th>
              <th>Ações</th>
            </tr>
          </thead>
          <tbody>
            {items.map((item) => (
              <tr key={item._id}>
                <td>{item._id}</td>
                <td>
                  {item.clientId?.name ? (
                    <Button
                      variant="link"
                      size="sm"
                      style={{ padding: 0 }}
                      onClick={() => setSearch(item.clientId.name)}
                    >
                      {item.clientId.name}
                    </Button>
                  ) : (
                    "-"
                  )}
                </td>
                <td>{item.sizeMatrixId?.name || "-"}</td>
                <td>{item.totalUnits}</td>
                <td>{new Date(item.createdAt).toLocaleString()}</td>
                <td style={{ minWidth: "220px" }}>
                  {editingId === item._id ? (
                    <Form.Control
                      type="text"
                      value={draftNotes}
                      onChange={(e) => setDraftNotes(e.target.value)}
                      placeholder="Notas"
                    />
                  ) : (
                    item.notes || "-"
                  )}
                </td>
                <td>
                  {editingId === item._id ? (
                    <>
                      <Button
                        size="sm"
                        variant="success"
                        onClick={() => saveEdit(item)}
                        style={{ marginRight: "8px" }}
                      >
                        Guardar
                      </Button>
                      <Button size="sm" variant="secondary" onClick={cancelEdit}>
                        Cancelar
                      </Button>
                    </>
                  ) : (
                    <>
                      <Button
                        size="sm"
                        variant="outline-primary"
                        onClick={() => startEdit(item)}
                        style={{ marginRight: "8px" }}
                      >
                        Editar Notas
                      </Button>
                      <Button
                        size="sm"
                        variant="outline-secondary"
                        onClick={() => openEdit(item)}
                        style={{ marginRight: "8px" }}
                      >
                        Editar Itens
                      </Button>
                      <Button
                        size="sm"
                        variant="outline-dark"
                        onClick={() => openPrintLabelsWindow(item)}
                        style={{ marginRight: "8px" }}
                      >
                        Imprimir
                      </Button>
                      <Button
                        size="sm"
                        variant="outline-danger"
                        onClick={() => requestDelete(item._id)}
                      >
                        Remover
                      </Button>
                    </>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </Table>
      )}
      <ConfirmModal
        show={confirm.show}
        title="Remover packing list"
        message="Tem a certeza que quer remover?"
        onCancel={() => setConfirm({ show: false, id: "" })}
        onConfirm={confirmDelete}
      />
      <MessageModal
        show={modal.show}
        title={modal.title}
        message={modal.message}
        onClose={closeModal}
      />
      <Modal
        show={!!editItem}
        onHide={closeEdit}
        size="xl"
        fullscreen="md-down"
      >
        <Modal.Header closeButton>
          <Modal.Title>Editar Packing List</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          {editItem ? (
            <div>
              <Form>
                <div className="row g-3 mb-3">
                  <div className="col-md-6">
                    <Form.Label>Cliente</Form.Label>
                    <Form.Select
                      value={editItem.clientId?._id || ""}
                      onChange={(e) => {
                        const nextClient = clients.find((c) => c._id === e.target.value);
                        const clientFields = normalizeClientLabelFields(nextClient?.labelFields);
                        setEditItem((prev) => ({
                          ...prev,
                          clientId: nextClient,
                          labelItems:
                            clientFields.length > 0
                              ? [createLabelItem(clientFields, 0)]
                              : []
                        }));
                      }}
                      isInvalid={!editItem.clientId?._id}
                    >
                      <option value="">-- selecionar --</option>
                      {clients.map((c) => (
                        <option key={c._id} value={c._id}>
                          {c.name}
                        </option>
                      ))}
                    </Form.Select>
                    <Form.Control.Feedback type="invalid">
                      Cliente é obrigatório.
                    </Form.Control.Feedback>
                  </div>
                  <div className="col-md-6">
                    <Form.Label>Matriz</Form.Label>
                    <Form.Select
                      value={editItem.sizeMatrixId?._id || ""}
                      onChange={(e) => {
                        const matrix = matrixes.find(
                          (m) => m._id === e.target.value
                        );
                        setEditItem((prev) => ({
                          ...prev,
                          sizeMatrixId: matrix || null,
                          sizeMatrix: matrix ? matrix.sizes : prev.sizeMatrix
                        }));
                      }}
                      isInvalid={!editItem.sizeMatrixId?._id}
                    >
                      <option value="">-- selecionar --</option>
                      {matrixes.map((m) => (
                        <option key={m._id} value={m._id}>
                          {m.name}
                        </option>
                      ))}
                    </Form.Select>
                    <Form.Control.Feedback type="invalid">
                      Matriz é obrigatória.
                    </Form.Control.Feedback>
                  </div>
                </div>
                {normalizeLabelItems(
                  editItem.labelItems,
                  normalizeClientLabelFields(editItem.clientId?.labelFields)
                ).length > 0 ? (
                  <div className="row g-3 mb-3">
                    {normalizeLabelItems(
                      editItem.labelItems,
                      normalizeClientLabelFields(editItem.clientId?.labelFields)
                    ).map((itemRow, idx) => (
                      <React.Fragment key={itemRow.itemId}>
                        {itemRow.fields.map((field) => (
                          <div className="col-md-4" key={`${itemRow.itemId}_${field.fieldId}`}>
                            <Form.Label>{field.name}</Form.Label>
                            <Form.Control
                              value={field.value}
                              onChange={(e) =>
                                setEditItem((prev) => ({
                                  ...prev,
                                  labelItems: normalizeLabelItems(
                                    prev.labelItems,
                                    normalizeClientLabelFields(prev.clientId?.labelFields)
                                  ).map((row) =>
                                    row.itemId !== itemRow.itemId
                                      ? row
                                      : {
                                          ...row,
                                          fields: row.fields.map((entry) =>
                                            entry.fieldId === field.fieldId
                                              ? { ...entry, value: e.target.value }
                                              : entry
                                          )
                                        }
                                  )
                                }))
                              }
                            />
                          </div>
                        ))}
                        <div className="col-md-12">
                          <Button
                            size="sm"
                            variant="outline-danger"
                            onClick={() =>
                              setEditItem((prev) => ({
                                ...prev,
                                labelItems: normalizeLabelItems(
                                  prev.labelItems,
                                  normalizeClientLabelFields(prev.clientId?.labelFields)
                                ).filter((row) => row.itemId !== itemRow.itemId)
                              }))
                            }
                            disabled={
                              normalizeLabelItems(
                                editItem.labelItems,
                                normalizeClientLabelFields(editItem.clientId?.labelFields)
                              ).length <= 1
                            }
                          >
                            Remover linha
                          </Button>
                        </div>
                        {idx <
                        normalizeLabelItems(
                          editItem.labelItems,
                          normalizeClientLabelFields(editItem.clientId?.labelFields)
                        ).length -
                          1 ? (
                          <div className="col-md-12">
                            <hr style={{ marginTop: 0 }} />
                          </div>
                        ) : null}
                      </React.Fragment>
                    ))}
                    <div className="col-md-12">
                      <Button
                        size="sm"
                        variant="outline-secondary"
                        onClick={() => {
                          const defs = normalizeClientLabelFields(editItem.clientId?.labelFields);
                          setEditItem((prev) => ({
                            ...prev,
                            labelItems: [
                              ...normalizeLabelItems(prev.labelItems, defs),
                              createLabelItem(defs, prev.labelItems?.length || 0)
                            ]
                          }));
                        }}
                      >
                        + Adicionar Referência
                      </Button>
                    </div>
                  </div>
                ) : null}
              </Form>
              <PackingListForm
                data={editItem.sizeMatrix}
                initialEntries={editItem.entries}
                initialTotalUnits={editItem.totalUnits}
                onSubmit={(payload) =>
                  saveEditItems({
                    ...payload,
                    po: editItem.po,
                    model: editItem.model,
                    clientId: editItem.clientId?._id || "",
                    sizeMatrixId: editItem.sizeMatrixId?._id || "",
                    labelItems: normalizeLabelItems(
                      editItem.labelItems,
                      normalizeClientLabelFields(editItem.clientId?.labelFields)
                    )
                  })
                }
                onInvalid={() =>
                  setModal({
                    show: true,
                    title: "Dados inválidos",
                    message:
                      "Existem linhas inválidas. Verifique as caixas sobrepostas ou campos obrigatórios."
                  })
                }
                submitLabel="Guardar Alterações"
                isSubmitDisabled={
                  !editItem.clientId?._id ||
                  !editItem.sizeMatrixId?._id
                }
                labelFieldDefs={normalizeClientLabelFields(editItem.clientId?.labelFields)}
                labelItems={normalizeLabelItems(
                  editItem.labelItems,
                  normalizeClientLabelFields(editItem.clientId?.labelFields)
                )}
              />
            </div>
          ) : null}
        </Modal.Body>
      </Modal>
    </div>
  );
};

export default PackingLists;
