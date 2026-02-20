import React, { useEffect, useState } from "react";
import { Button, Form, Table } from "react-bootstrap";
import { deleteClient, fetchClients, updateClient } from "../../../api/clients";
import ConfirmModal from "../../Common/ConfirmModal";
import MessageModal from "../../Common/MessageModal";
import { fetchLabelTemplates } from "../../../api/labelTemplates";
import { createLabelField, normalizeClientLabelFields } from "../../../utils/labelFields";

// Listagem de clientes
const Clients = () => {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(false);
  const [confirm, setConfirm] = useState({ show: false, id: "" });
  const [editingId, setEditingId] = useState("");
  const [draft, setDraft] = useState({
    name: "",
    code: "",
    contact: "",
    notes: "",
    labelTemplateId: "",
    labelFields: []
  });
  const [templates, setTemplates] = useState([]);
  const [search, setSearch] = useState("");
  const [modal, setModal] = useState({
    show: false,
    title: "",
    message: ""
  });

  // Fecha o modal
  const closeModal = () => setModal({ show: false, title: "", message: "" });

  // Carrega clientes
  const loadItems = (query) => {
    setLoading(true);
    fetchClients(query ? { q: query } : {})
      .then((data) => setItems(data))
      .catch(() => {
        setModal({
          show: true,
          title: "Erro",
          message: "Erro ao carregar clientes."
        });
      })
      .finally(() => setLoading(false));
  };

  // Carrega ao montar
  useEffect(() => {
    loadItems();
    fetchLabelTemplates({ active: true }).then(setTemplates).catch(() => {});
  }, []);

  // Pesquisa com debounce
  useEffect(() => {
    const handle = setTimeout(() => {
      loadItems(search.trim());
    }, 300);
    return () => clearTimeout(handle);
  }, [search]);

  // Abre confirmação de remoção
  const requestDelete = (id) => {
    setConfirm({ show: true, id });
  };

  // Confirma remoção
  const confirmDelete = () => {
    const id = confirm.id;
    setConfirm({ show: false, id: "" });
    deleteClient(id)
      .then(() => {
        setItems((prev) => prev.filter((item) => item._id !== id));
      })
      .catch(() => {
        setModal({
          show: true,
          title: "Erro",
          message: "Erro ao remover cliente."
        });
      });
  };

  // Inicia edição inline do cliente
  const startEdit = (item) => {
    setEditingId(item._id);
    setDraft({
      name: item.name || "",
      code: item.code || "",
      contact: item.contact || "",
      notes: item.notes || "",
      labelTemplateId: item.labelTemplateId?._id || "",
      labelFields: normalizeClientLabelFields(item.labelFields)
    });
  };

  // Cancela edição do cliente
  const cancelEdit = () => {
    setEditingId("");
    setDraft({
      name: "",
      code: "",
      contact: "",
      notes: "",
      labelTemplateId: "",
      labelFields: []
    });
  };

  // Guarda alterações do cliente
  const saveEdit = (item) => {
    if (!draft.name.trim()) {
      setModal({
        show: true,
        title: "Dados inválidos",
        message: "O nome do cliente é obrigatório."
      });
      return;
    }
    updateClient(item._id, {
      ...draft,
      labelFields: normalizeClientLabelFields(draft.labelFields)
    })
      .then((updated) => {
        setItems((prev) =>
          prev.map((row) => (row._id === updated._id ? updated : row))
        );
        cancelEdit();
      })
      .catch(() => {
        setModal({
          show: true,
          title: "Erro",
          message: "Erro ao atualizar cliente."
        });
      });
  };

  return (
    <div>
      <h3>Clientes</h3>
      <div style={{ display: "flex", gap: "12px", marginBottom: "12px" }}>
        <Form.Control
          placeholder="Pesquisar por nome, código ou contacto..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          style={{ maxWidth: "320px" }}
        />
        <Button
          onClick={() => loadItems(search.trim())}
          disabled={loading}
          variant="outline-primary"
        >
          {loading ? "A carregar..." : "Recarregar"}
        </Button>
      </div>
      {items.length === 0 ? (
        <p style={{ marginTop: "12px" }}>Sem resultados.</p>
      ) : (
        <Table striped bordered hover responsive style={{ marginTop: "12px" }}>
          <thead className="table-dark">
            <tr>
              <th>Nome</th>
              <th>Código</th>
              <th>Contacto</th>
              <th>Notas</th>
              <th>Layout</th>
              <th>Campos do Rótulo</th>
              <th>Ações</th>
            </tr>
          </thead>
          <tbody>
            {items.map((item) => (
              <tr key={item._id}>
                <td style={{ minWidth: "180px" }}>
                  {editingId === item._id ? (
                    <Form.Group>
                      <Form.Control
                        value={draft.name}
                        onChange={(e) =>
                          setDraft((prev) => ({ ...prev, name: e.target.value }))
                        }
                        isInvalid={!draft.name.trim()}
                      />
                      <Form.Control.Feedback type="invalid">
                        Nome obrigatório.
                      </Form.Control.Feedback>
                    </Form.Group>
                  ) : (
                    item.name
                  )}
                </td>
                <td style={{ minWidth: "120px" }}>
                  {editingId === item._id ? (
                    <Form.Control
                      value={draft.code}
                      onChange={(e) =>
                        setDraft((prev) => ({ ...prev, code: e.target.value }))
                      }
                    />
                  ) : (
                    item.code || "-"
                  )}
                </td>
                <td style={{ minWidth: "160px" }}>
                  {editingId === item._id ? (
                    <Form.Control
                      value={draft.contact}
                      onChange={(e) =>
                        setDraft((prev) => ({
                          ...prev,
                          contact: e.target.value
                        }))
                      }
                    />
                  ) : (
                    item.contact || "-"
                  )}
                </td>
                <td style={{ minWidth: "180px" }}>
                  {editingId === item._id ? (
                    <Form.Control
                      value={draft.notes}
                      onChange={(e) =>
                        setDraft((prev) => ({ ...prev, notes: e.target.value }))
                      }
                    />
                  ) : (
                    item.notes || "-"
                  )}
                </td>
                <td style={{ minWidth: "180px" }}>
                  {editingId === item._id ? (
                    <Form.Select
                      value={draft.labelTemplateId}
                      onChange={(e) =>
                        setDraft((prev) => ({
                          ...prev,
                          labelTemplateId: e.target.value
                        }))
                      }
                    >
                      <option value="">Default global</option>
                      {templates
                        .filter(
                          (template) =>
                            !template.clientId || template.clientId?._id === item._id
                        )
                        .map((template) => (
                        <option key={template._id} value={template._id}>
                          {template.name}
                        </option>
                        ))}
                    </Form.Select>
                  ) : (
                    item.labelTemplateId?.name || "Default global"
                  )}
                </td>
                <td style={{ minWidth: "260px" }}>
                  {editingId === item._id ? (
                    <div>
                      {draft.labelFields.map((field, index) => (
                        <div
                          key={field.fieldId}
                          className="d-flex gap-2 align-items-center mb-2"
                        >
                          <Form.Control
                            size="sm"
                            placeholder={`Campo ${index + 1}`}
                            value={field.name}
                            onChange={(e) =>
                              setDraft((prev) => ({
                                ...prev,
                                labelFields: prev.labelFields.map((row) =>
                                  row.fieldId === field.fieldId
                                    ? { ...row, name: e.target.value }
                                    : row
                                )
                              }))
                            }
                          />
                          <Button
                            size="sm"
                            variant="outline-danger"
                            onClick={() =>
                              setDraft((prev) => ({
                                ...prev,
                                labelFields: prev.labelFields.filter(
                                  (row) => row.fieldId !== field.fieldId
                                )
                              }))
                            }
                          >
                            Remover
                          </Button>
                        </div>
                      ))}
                      <Button
                        size="sm"
                        variant="outline-secondary"
                        onClick={() =>
                          setDraft((prev) => ({
                            ...prev,
                            labelFields: [
                              ...prev.labelFields,
                              createLabelField(prev.labelFields.length)
                            ]
                          }))
                        }
                      >
                        + Campo
                      </Button>
                    </div>
                  ) : (
                    <div style={{ fontSize: "12px" }}>
                      {normalizeClientLabelFields(item.labelFields).length === 0
                        ? "-"
                        : normalizeClientLabelFields(item.labelFields).map(
                            (field) => (
                              <div key={field.fieldId}>{field.name}</div>
                            )
                          )}
                    </div>
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
                        Editar
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
        title="Remover cliente"
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
    </div>
  );
};

export default Clients;
