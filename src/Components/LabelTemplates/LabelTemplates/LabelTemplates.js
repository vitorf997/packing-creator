import React, { useCallback, useEffect, useMemo, useState } from "react";
import { Button, Card, Form, Table } from "react-bootstrap";
import {
  createLabelTemplate,
  fetchLabelTemplates,
  updateLabelTemplate
} from "../../../api/labelTemplates";
import { fetchClients } from "../../../api/clients";
import MessageModal from "../../Common/MessageModal";
import { normalizeClientLabelFields } from "../../../utils/labelFields";

const emptyLayout = {
  brandName: "FERMIR",
  brandBgColor: "#8dc63f",
  brandTextColor: "#ffffff",
  topLeftField: "model",
  topRightField: "po",
  emptyRows: 4,
  showRemainderLabel: true
};

// Gestão de templates de etiqueta com preview
const LabelTemplates = () => {
  const [templates, setTemplates] = useState([]);
  const [clients, setClients] = useState([]);
  const [selectedId, setSelectedId] = useState("");
  const [search, setSearch] = useState("");
  const [form, setForm] = useState({
    name: "",
    key: "",
    clientId: "",
    active: true,
    isDefault: false,
    layout: emptyLayout
  });
  const [saving, setSaving] = useState(false);
  const [modal, setModal] = useState({ show: false, title: "", message: "" });
  const selectedClient = useMemo(
    () => clients.find((item) => item._id === form.clientId) || null,
    [clients, form.clientId]
  );
  const selectedClientFields = useMemo(() => {
    const fields = normalizeClientLabelFields(selectedClient?.labelFields);
    if (fields.length > 0) return fields;
    return [
      { fieldId: "field_1", name: "Campo 1" },
      { fieldId: "field_2", name: "Campo 2" },
      { fieldId: "field_3", name: "Campo 3" }
    ];
  }, [selectedClient]);

  const closeModal = () => setModal({ show: false, title: "", message: "" });

  const loadTemplates = useCallback(() => {
    fetchLabelTemplates(search.trim() ? { q: search.trim() } : {})
      .then((data) => setTemplates(data))
      .catch(() => {
        setModal({
          show: true,
          title: "Erro",
          message: "Erro ao carregar templates."
        });
      });
  }, [search]);

  useEffect(() => {
    fetchClients().then(setClients).catch(() => {});
  }, []);

  useEffect(() => {
    const handle = setTimeout(() => loadTemplates(), 250);
    return () => clearTimeout(handle);
  }, [search, loadTemplates]);

  useEffect(() => {
    const selected = templates.find((item) => item._id === selectedId);
    if (!selected) return;
    setForm({
      name: selected.name || "",
      key: selected.key || "",
      clientId: selected.clientId?._id || "",
      active: selected.active !== false,
      isDefault: Boolean(selected.isDefault),
      layout: {
        ...emptyLayout,
        ...(selected.layout || {})
      }
    });
  }, [selectedId, templates]);

  const onLayoutChange = (name, value) => {
    setForm((prev) => ({
      ...prev,
      layout: { ...prev.layout, [name]: value }
    }));
  };

  const resetForm = () => {
    setSelectedId("");
    setForm({
      name: "",
      key: "",
      clientId: "",
      active: true,
      isDefault: false,
      layout: emptyLayout
    });
  };

  const payload = useMemo(() => {
    return {
      name: form.name,
      key: form.key,
      clientId: form.clientId || null,
      active: form.active,
      isDefault: form.isDefault,
      type: "A6_LANDSCAPE",
      layout: {
        ...form.layout,
        emptyRows: Number(form.layout.emptyRows) || 0
      }
    };
  }, [form]);

  const save = () => {
    if (!form.name.trim() || !form.key.trim()) {
      setModal({
        show: true,
        title: "Dados inválidos",
        message: "Nome e chave do template são obrigatórios."
      });
      return;
    }
    if (!form.isDefault && !form.clientId) {
      setModal({
        show: true,
        title: "Dados inválidos",
        message: "Associe um cliente ao template ou marque como default global."
      });
      return;
    }

    setSaving(true);
    const action = selectedId
      ? updateLabelTemplate(selectedId, payload)
      : createLabelTemplate(payload);

    action
      .then(() => {
        setModal({
          show: true,
          title: "Sucesso",
          message: selectedId
            ? "Template atualizado com sucesso."
            : "Template criado com sucesso."
        });
        resetForm();
        loadTemplates();
      })
      .catch(() => {
        setModal({
          show: true,
          title: "Erro",
          message: "Não foi possível guardar o template."
        });
      })
      .finally(() => setSaving(false));
  };

  return (
    <Card style={{ padding: "16px" }}>
      <h3>Layouts de Etiqueta</h3>
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "1.2fr 1fr",
          gap: "16px",
          alignItems: "start"
        }}
      >
        <div>
          <div style={{ display: "flex", gap: "8px", marginBottom: "8px" }}>
            <Form.Control
              value={search}
              onChange={(event) => setSearch(event.target.value)}
              placeholder="Pesquisar por nome/chave..."
            />
            <Button variant="outline-primary" onClick={() => loadTemplates()}>
              Recarregar
            </Button>
          </div>
          <Table striped bordered hover responsive>
            <thead className="table-dark">
              <tr>
                <th>Nome</th>
                <th>Chave</th>
                <th>Cliente</th>
                <th>Default</th>
                <th>Ativo</th>
              </tr>
            </thead>
            <tbody>
              {templates.map((item) => (
                <tr
                  key={item._id}
                  onClick={() => setSelectedId(item._id)}
                  style={{
                    cursor: "pointer",
                    backgroundColor:
                      selectedId === item._id ? "rgba(13,110,253,.08)" : "inherit"
                  }}
                >
                  <td>{item.name}</td>
                  <td>{item.key}</td>
                  <td>{item.clientId?.name || "-"}</td>
                  <td>{item.isDefault ? "Sim" : "Não"}</td>
                  <td>{item.active ? "Sim" : "Não"}</td>
                </tr>
              ))}
            </tbody>
          </Table>
        </div>
        <div>
          <h5>{selectedId ? "Editar template" : "Novo template"}</h5>
          <Form.Group className="mb-2">
            <Form.Label>Nome</Form.Label>
            <Form.Control
              value={form.name}
              onChange={(event) =>
                setForm((prev) => ({ ...prev, name: event.target.value }))
              }
            />
          </Form.Group>
          <Form.Group className="mb-2">
            <Form.Label>Chave</Form.Label>
            <Form.Control
              value={form.key}
              onChange={(event) =>
                setForm((prev) => ({ ...prev, key: event.target.value }))
              }
              placeholder="ex: cliente_x_a6"
            />
          </Form.Group>
          <Form.Group className="mb-2">
            <Form.Label>Cliente</Form.Label>
            <Form.Select
              value={form.clientId}
              onChange={(event) =>
                setForm((prev) => ({ ...prev, clientId: event.target.value }))
              }
              disabled={form.isDefault}
            >
              <option value="">-- sem cliente --</option>
              {clients.map((client) => (
                <option key={client._id} value={client._id}>
                  {client.name}
                </option>
              ))}
            </Form.Select>
          </Form.Group>
          <Form.Group className="mb-2">
            <Form.Label>Marca (caixa verde)</Form.Label>
            <Form.Control
              value={form.layout.brandName}
              onChange={(event) => onLayoutChange("brandName", event.target.value)}
            />
          </Form.Group>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "8px" }}>
            <Form.Group className="mb-2">
              <Form.Label>Cor fundo marca</Form.Label>
              <Form.Control
                value={form.layout.brandBgColor}
                onChange={(event) =>
                  onLayoutChange("brandBgColor", event.target.value)
                }
              />
            </Form.Group>
            <Form.Group className="mb-2">
              <Form.Label>Cor texto marca</Form.Label>
              <Form.Control
                value={form.layout.brandTextColor}
                onChange={(event) =>
                  onLayoutChange("brandTextColor", event.target.value)
                }
              />
            </Form.Group>
          </div>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "8px" }}>
            <Form.Group className="mb-2">
              <Form.Label>Campo topo esquerdo</Form.Label>
              <Form.Select
                value={form.layout.topLeftField}
                onChange={(event) => onLayoutChange("topLeftField", event.target.value)}
              >
                {selectedClientFields.map((field) => (
                  <option key={`left_${field.fieldId}`} value={`field:${field.fieldId}`}>
                    {field.name}
                  </option>
                ))}
                <option value="model">Model (legado)</option>
                <option value="po">PO (legado)</option>
              </Form.Select>
            </Form.Group>
            <Form.Group className="mb-2">
              <Form.Label>Campo topo direito</Form.Label>
              <Form.Select
                value={form.layout.topRightField}
                onChange={(event) => onLayoutChange("topRightField", event.target.value)}
              >
                {selectedClientFields.map((field) => (
                  <option key={`right_${field.fieldId}`} value={`field:${field.fieldId}`}>
                    {field.name}
                  </option>
                ))}
                <option value="po">PO (legado)</option>
                <option value="model">Model (legado)</option>
              </Form.Select>
            </Form.Group>
          </div>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "8px" }}>
            <Form.Group className="mb-2">
              <Form.Label>Linhas vazias</Form.Label>
              <Form.Control
                type="number"
                min={0}
                max={8}
                value={form.layout.emptyRows}
                onChange={(event) => onLayoutChange("emptyRows", event.target.value)}
              />
            </Form.Group>
            <Form.Group className="mb-2 d-flex align-items-end">
              <Form.Check
                type="checkbox"
                label={'Mostrar "Caixa de restos"'}
                checked={form.layout.showRemainderLabel}
                onChange={(event) =>
                  onLayoutChange("showRemainderLabel", event.target.checked)
                }
              />
            </Form.Group>
          </div>
          <Form.Check
            type="checkbox"
            className="mb-2"
            label="Template ativo"
            checked={form.active}
            onChange={(event) =>
              setForm((prev) => ({ ...prev, active: event.target.checked }))
            }
          />
          <Form.Check
            type="checkbox"
            className="mb-3"
            label="Template global default"
            checked={form.isDefault}
            onChange={(event) =>
              setForm((prev) => ({ ...prev, isDefault: event.target.checked }))
            }
          />
          <div style={{ display: "flex", gap: "8px" }}>
            <Button onClick={save} disabled={saving}>
              {saving ? "A guardar..." : "Guardar Template"}
            </Button>
            <Button variant="outline-secondary" onClick={resetForm}>
              Limpar
            </Button>
          </div>
          <div
            style={{
              marginTop: "16px",
              border: "1px solid #dee2e6",
              borderRadius: "8px",
              padding: "12px",
              background: "#f8f9fa"
            }}
          >
            <div style={{ fontWeight: 600, marginBottom: "8px" }}>Preview</div>
            <LabelPreview form={form} clients={clients} />
          </div>
        </div>
      </div>
      <MessageModal
        show={modal.show}
        title={modal.title}
        message={modal.message}
        onClose={closeModal}
      />
    </Card>
  );
};

const LabelPreview = ({ form, clients }) => {
  const client = clients.find((item) => item._id === form.clientId);
  const previewFields = normalizeClientLabelFields(client?.labelFields);
  const tableFields =
    previewFields.length > 0
      ? previewFields
      : [
          { fieldId: "field_1", name: "Campo 1" },
          { fieldId: "field_2", name: "Campo 2" },
          { fieldId: "field_3", name: "Campo 3" }
        ];
  const brandColor = form.layout.brandBgColor || "#8dc63f";
  const brandTextColor = form.layout.brandTextColor || "#ffffff";
  const topLeftValue = getPreviewTopValue(form.layout.topLeftField, tableFields, "MODEL");
  const topRightValue = getPreviewTopValue(form.layout.topRightField, tableFields, "PO");

  return (
    <div style={{ transform: "scale(0.95)", transformOrigin: "top left" }}>
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "1fr 1fr",
          gap: "6px",
          marginBottom: "6px"
        }}
      >
        <div style={previewBox}>{topLeftValue}</div>
        <div style={previewBox}>{topRightValue}</div>
      </div>
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "1.4fr 1fr",
          gap: "6px",
          marginBottom: "6px"
        }}
      >
        <div
          style={{
            ...previewBox,
            background: brandColor,
            color: brandTextColor,
            fontWeight: 700
          }}
        >
          {form.layout.brandName || "FERMIR"}
        </div>
        <div style={{ ...previewBox, fontWeight: 700 }}>{client?.name || "CLIENTE"}</div>
      </div>
      <table
        style={{
          width: "100%",
          borderCollapse: "collapse",
          fontSize: "10px",
          background: "#fff"
        }}
      >
        <thead>
          <tr>
            {tableFields.map((field) => (
              <th key={field.fieldId} style={previewCell}>
                {field.name}
              </th>
            ))}
            <th style={previewCell}>XS</th>
            <th style={previewCell}>S</th>
            <th style={previewCell}>M</th>
            <th style={previewCell}>L</th>
          </tr>
        </thead>
        <tbody>
          <tr>
            {tableFields.map((field, index) => (
              <td key={`${field.fieldId}_value`} style={previewCell}>
                V{index + 1}
              </td>
            ))}
            <td style={previewCell}></td>
            <td style={{ ...previewCell, color: "#d0021b", fontWeight: 700 }}>31</td>
            <td style={previewCell}></td>
            <td style={previewCell}></td>
          </tr>
        </tbody>
      </table>
      <div style={{ ...previewBox, marginTop: "6px", fontSize: "20px", fontWeight: 700 }}>
        19/20
      </div>
    </div>
  );
};

const previewBox = {
  border: "1px solid #111",
  minHeight: "26px",
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
  background: "#fff"
};

const previewCell = {
  border: "1px solid #111",
  padding: "3px",
  textAlign: "center"
};

const getPreviewTopValue = (field, tableFields, fallback) => {
  if (String(field || "").startsWith("field:")) {
    const fieldId = String(field).slice(6);
    const found = tableFields.find((item) => item.fieldId === fieldId);
    if (found) return found.name.toUpperCase();
  }
  if (field === "model") return "MODEL";
  if (field === "po") return "PO";
  return fallback;
};

export default LabelTemplates;
