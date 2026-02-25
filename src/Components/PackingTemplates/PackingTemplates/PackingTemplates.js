import React, { useCallback, useEffect, useMemo, useState } from "react";
import { Button, Card, Form, Table } from "react-bootstrap";
import { fetchClients } from "../../../api/clients";
import {
  createPackingTemplate,
  deletePackingTemplate,
  fetchPackingTemplates,
  updatePackingTemplate
} from "../../../api/packingTemplates";
import ConfirmModal from "../../Common/ConfirmModal";
import MessageModal from "../../Common/MessageModal";
import { normalizeClientLabelFields } from "../../../utils/labelFields";

const emptyLayout = {
  orientation: "portrait",
  companyName: "FERMIR",
  title: "LISTA DE CONTEÚDO / PACKING LIST",
  topLeftField: "po",
  topRightField: "model",
  headerFields: [
    { label: "Cliente / Customer", source: "clientName" },
    { label: "PO", source: "po" },
    { label: "Modelo", source: "model" }
  ],
  detailFieldColumnIds: [],
  emptyRows: 10,
  showSummary: true
};

const baseSources = [
  { value: "clientName", label: "Cliente" },
  { value: "po", label: "PO" },
  { value: "model", label: "Modelo" },
  { value: "date", label: "Data atual" }
];

const packingColumnOptions = [
  { value: "col:sequence", label: "Sequência" },
  { value: "col:boxes", label: "Nº bultos" },
  { value: "col:unitsPerBox", label: "Unid./bulto" },
  { value: "col:boxFrom", label: "Caixa De" },
  { value: "col:boxTo", label: "Caixa Até" },
  { value: "col:remainBox", label: "Caixa de restos" },
  { value: "col:size", label: "Tamanho" },
  { value: "col:quantity", label: "Quantidade" },
  { value: "col:rowTotal", label: "Total linha" },
  { value: "col:totalUnits", label: "Total geral" },
  { value: "col:notes", label: "Observações" }
];

// Gestão de templates de impressão do Packing
const PackingTemplates = () => {
  const [templates, setTemplates] = useState([]);
  const [clients, setClients] = useState([]);
  const [selectedId, setSelectedId] = useState("");
  const [search, setSearch] = useState("");
  const [saving, setSaving] = useState(false);
  const [confirm, setConfirm] = useState({ show: false, id: "" });
  const [newDetailColumn, setNewDetailColumn] = useState("");
  const [modal, setModal] = useState({ show: false, title: "", message: "" });
  const [form, setForm] = useState({
    name: "",
    key: "",
    clientId: "",
    active: true,
    isDefault: false,
    layout: emptyLayout
  });

  const closeModal = () => setModal({ show: false, title: "", message: "" });

  const selectedClient = useMemo(
    () => clients.find((item) => item._id === form.clientId) || null,
    [clients, form.clientId]
  );

  const clientFields = useMemo(
    () => normalizeClientLabelFields(selectedClient?.labelFields),
    [selectedClient]
  );

  const fieldOptions = useMemo(
    () => [
      ...baseSources,
      ...clientFields.map((field) => ({
        value: `field:${field.fieldId}`,
        label: field.name
      }))
    ],
    [clientFields]
  );

  const detailColumnOptions = useMemo(
    () => [
      ...packingColumnOptions,
      ...clientFields.map((field) => ({
        value: `field:${field.fieldId}`,
        label: field.name
      }))
    ],
    [clientFields]
  );

  const detailLabelById = useMemo(
    () =>
      detailColumnOptions.reduce((acc, item) => {
        acc[item.value] = item.label;
        return acc;
      }, {}),
    [detailColumnOptions]
  );

  const loadTemplates = useCallback(() => {
    fetchPackingTemplates(search.trim() ? { q: search.trim() } : {})
      .then((data) => setTemplates(data))
      .catch(() => {
        setModal({
          show: true,
          title: "Erro",
          message: "Erro ao carregar layouts do Packing."
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
        ...(selected.layout || {}),
        headerFields:
          selected.layout?.headerFields?.length > 0
            ? selected.layout.headerFields
            : emptyLayout.headerFields
      }
    });
  }, [selectedId, templates]);

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

  const updateLayoutField = (name, value) => {
    setForm((prev) => ({
      ...prev,
      layout: { ...prev.layout, [name]: value }
    }));
  };

  const updateHeaderRow = (index, fieldName, value) => {
    setForm((prev) => ({
      ...prev,
      layout: {
        ...prev.layout,
        headerFields: (prev.layout.headerFields || []).map((row, rowIndex) =>
          rowIndex === index ? { ...row, [fieldName]: value } : row
        )
      }
    }));
  };

  const addHeaderRow = () => {
    setForm((prev) => ({
      ...prev,
      layout: {
        ...prev.layout,
        headerFields: [
          ...(prev.layout.headerFields || []),
          { label: "Novo campo", source: "clientName" }
        ]
      }
    }));
  };

  const addDetailColumn = () => {
    if (!newDetailColumn) return;
    setForm((prev) => {
      const current = Array.isArray(prev.layout.detailFieldColumnIds)
        ? prev.layout.detailFieldColumnIds
        : [];
      if (current.includes(newDetailColumn)) return prev;
      return {
        ...prev,
        layout: {
          ...prev.layout,
          detailFieldColumnIds: [...current, newDetailColumn]
        }
      };
    });
    setNewDetailColumn("");
  };

  const moveDetailColumn = (index, direction) => {
    setForm((prev) => {
      const current = Array.isArray(prev.layout.detailFieldColumnIds)
        ? [...prev.layout.detailFieldColumnIds]
        : [];
      const target = direction === "up" ? index - 1 : index + 1;
      if (target < 0 || target >= current.length) return prev;
      const tmp = current[index];
      current[index] = current[target];
      current[target] = tmp;
      return {
        ...prev,
        layout: {
          ...prev.layout,
          detailFieldColumnIds: current
        }
      };
    });
  };

  const removeDetailColumn = (index) => {
    setForm((prev) => ({
      ...prev,
      layout: {
        ...prev.layout,
        detailFieldColumnIds: (prev.layout.detailFieldColumnIds || []).filter(
          (_, rowIndex) => rowIndex !== index
        )
      }
    }));
  };

  const removeHeaderRow = (index) => {
    setForm((prev) => ({
      ...prev,
      layout: {
        ...prev.layout,
        headerFields: (prev.layout.headerFields || []).filter(
          (_, rowIndex) => rowIndex !== index
        )
      }
    }));
  };

  const payload = useMemo(
    () => ({
      name: form.name,
      key: form.key,
      clientId: form.clientId || null,
      active: form.active,
      isDefault: form.isDefault,
      type: "A4_PORTRAIT",
      layout: {
        ...form.layout,
        emptyRows: Number(form.layout.emptyRows) || 0
      }
    }),
    [form]
  );

  const save = () => {
    if (!form.name.trim() || !form.key.trim()) {
      setModal({
        show: true,
        title: "Dados inválidos",
        message: "Nome e chave são obrigatórios."
      });
      return;
    }
    if (!form.isDefault && !form.clientId) {
      setModal({
        show: true,
        title: "Dados inválidos",
        message: "Selecione cliente ou marque como default global."
      });
      return;
    }

    setSaving(true);
    const action = selectedId
      ? updatePackingTemplate(selectedId, payload)
      : createPackingTemplate(payload);
    action
      .then(() => {
        setModal({
          show: true,
          title: "Sucesso",
          message: selectedId
            ? "Layout do Packing atualizado com sucesso."
            : "Layout do Packing criado com sucesso."
        });
        resetForm();
        loadTemplates();
      })
      .catch((error) => {
        setModal({
          show: true,
          title: "Erro",
          message: error?.message || "Não foi possível guardar o layout do Packing."
        });
      })
      .finally(() => setSaving(false));
  };

  const confirmDelete = () => {
    const id = confirm.id;
    setConfirm({ show: false, id: "" });
    if (!id) return;
    deletePackingTemplate(id)
      .then(() => {
        if (id === selectedId) resetForm();
        loadTemplates();
      })
      .catch((error) =>
        setModal({
          show: true,
          title: "Erro",
          message: error?.message || "Não foi possível remover o layout do Packing."
        })
      );
  };

  return (
    <Card className="pageSectionCard">
      <h3 className="mb-3">Layout Packing</h3>
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "1.15fr 1fr",
          gap: "16px",
          alignItems: "start"
        }}
      >
        <div>
          <div className="pageFilters">
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
                <th>Ações</th>
              </tr>
            </thead>
            <tbody>
              {templates.map((item) => (
                <tr
                  key={item._id}
                  onClick={() => setSelectedId(item._id)}
                  className={`tableSelectableRow ${
                    selectedId === item._id ? "isSelected" : ""
                  }`}
                >
                  <td>{item.name}</td>
                  <td>{item.key}</td>
                  <td>{item.clientId?.name || "-"}</td>
                  <td>{item.isDefault ? "Sim" : "Não"}</td>
                  <td>{item.active ? "Sim" : "Não"}</td>
                  <td>
                    <Button
                      size="sm"
                      variant="outline-danger"
                      onClick={(event) => {
                        event.stopPropagation();
                        setConfirm({ show: true, id: item._id });
                      }}
                    >
                      Remover
                    </Button>
                  </td>
                </tr>
              ))}
            </tbody>
          </Table>
        </div>
        <div>
          <h5>{selectedId ? "Editar layout do Packing" : "Novo layout do Packing"}</h5>
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
              placeholder="ex: cliente_x_a4"
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
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "8px" }}>
            <Form.Group className="mb-2">
              <Form.Label>Campo topo esquerdo</Form.Label>
              <Form.Select
                value={form.layout.topLeftField}
                onChange={(event) => updateLayoutField("topLeftField", event.target.value)}
              >
                {fieldOptions.map((option) => (
                  <option key={`left_${option.value}`} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </Form.Select>
            </Form.Group>
            <Form.Group className="mb-2">
              <Form.Label>Campo topo direito</Form.Label>
              <Form.Select
                value={form.layout.topRightField}
                onChange={(event) => updateLayoutField("topRightField", event.target.value)}
              >
                {fieldOptions.map((option) => (
                  <option key={`right_${option.value}`} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </Form.Select>
            </Form.Group>
          </div>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "8px" }}>
            <Form.Group className="mb-2">
              <Form.Label>Empresa</Form.Label>
              <Form.Control
                value={form.layout.companyName}
                onChange={(event) => updateLayoutField("companyName", event.target.value)}
              />
            </Form.Group>
            <Form.Group className="mb-2">
              <Form.Label>Título</Form.Label>
              <Form.Control
                value={form.layout.title}
                onChange={(event) => updateLayoutField("title", event.target.value)}
              />
            </Form.Group>
          </div>

          <h6 className="mt-3 mb-2">Campos de cabeçalho</h6>
          {(form.layout.headerFields || []).map((row, index) => (
            <div
              key={`header_${index}`}
              style={{ display: "grid", gridTemplateColumns: "1fr 1fr auto", gap: "8px" }}
              className="mb-2"
            >
              <Form.Control
                value={row.label}
                onChange={(event) =>
                  updateHeaderRow(index, "label", event.target.value)
                }
                placeholder="Etiqueta"
              />
              <Form.Select
                value={row.source}
                onChange={(event) =>
                  updateHeaderRow(index, "source", event.target.value)
                }
              >
                {fieldOptions.map((option) => (
                  <option key={`row_${index}_${option.value}`} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </Form.Select>
              <Button
                variant="outline-danger"
                onClick={() => removeHeaderRow(index)}
                disabled={(form.layout.headerFields || []).length <= 1}
              >
                -
              </Button>
            </div>
          ))}
          <Button size="sm" variant="outline-secondary" onClick={addHeaderRow}>
            + Adicionar campo de cabeçalho
          </Button>

          <h6 className="mt-3 mb-2">Colunas da tabela (ordem de impressão)</h6>
          <div
            style={{
              display: "grid",
              gridTemplateColumns: "1fr auto",
              gap: "8px",
              marginBottom: "8px"
            }}
          >
            <Form.Select
              value={newDetailColumn}
              onChange={(event) => setNewDetailColumn(event.target.value)}
            >
              <option value="">-- escolher campo --</option>
              {detailColumnOptions.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </Form.Select>
            <Button variant="outline-secondary" onClick={addDetailColumn}>
              + Adicionar campo
            </Button>
          </div>
          {(form.layout.detailFieldColumnIds || []).length === 0 ? (
            <div className="text-muted mb-2">Sem colunas extra configuradas.</div>
          ) : (
            (form.layout.detailFieldColumnIds || []).map((columnId, index, arr) => (
              <div
                key={`${columnId}_${index}`}
                style={{
                  display: "grid",
                  gridTemplateColumns: "1fr auto auto auto",
                  gap: "8px",
                  marginBottom: "6px",
                  alignItems: "center"
                }}
              >
                <div className="form-control">
                  {detailLabelById[columnId] || columnId}
                </div>
                <Button
                  size="sm"
                  variant="outline-secondary"
                  onClick={() => moveDetailColumn(index, "up")}
                  disabled={index === 0}
                >
                  ↑
                </Button>
                <Button
                  size="sm"
                  variant="outline-secondary"
                  onClick={() => moveDetailColumn(index, "down")}
                  disabled={index === arr.length - 1}
                >
                  ↓
                </Button>
                <Button
                  size="sm"
                  variant="outline-danger"
                  onClick={() => removeDetailColumn(index)}
                >
                  Remover
                </Button>
              </div>
            ))
          )}

          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "8px" }}>
            <Form.Group className="mb-2">
              <Form.Label>Linhas vazias</Form.Label>
              <Form.Control
                type="number"
                min={0}
                max={25}
                value={form.layout.emptyRows}
                onChange={(event) => updateLayoutField("emptyRows", event.target.value)}
              />
            </Form.Group>
            <Form.Group className="mb-2 d-flex align-items-end">
              <Form.Check
                type="checkbox"
                label="Mostrar tabela resumo"
                checked={form.layout.showSummary}
                onChange={(event) =>
                  updateLayoutField("showSummary", event.target.checked)
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
              {saving ? "A guardar..." : "Guardar Layout"}
            </Button>
            <Button variant="outline-secondary" onClick={resetForm}>
              Limpar
            </Button>
          </div>

          <div
            style={{
              marginTop: "14px",
              border: "1px solid var(--surface-border)",
              borderRadius: "8px",
              padding: "10px",
              background: "var(--surface-alt-bg)"
            }}
          >
            <div style={{ fontWeight: 600, marginBottom: "8px" }}>Preview</div>
            <PackingPreview form={form} client={selectedClient} clientFields={clientFields} />
          </div>
        </div>
      </div>

      <ConfirmModal
        show={confirm.show}
        title="Remover layout do Packing"
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
    </Card>
  );
};

const resolvePreviewValue = (source, client, clientFields) => {
  if (source === "clientName") return client?.name || "CLIENTE";
  if (source === "po") return "PO_12345";
  if (source === "model") return "MODEL_ABC";
  if (source === "date") return new Date().toLocaleDateString();
  if (String(source || "").startsWith("field:")) {
    const fieldId = String(source).slice(6);
    const found = clientFields.find((field) => field.fieldId === fieldId);
    return found?.name || "Campo";
  }
  return "-";
};

const PackingPreview = ({ form, client, clientFields }) => {
  const columns = [
    "Sequência",
    "Nº bultos",
    "Un./bulto",
    ...(form.layout.detailFieldColumnIds || []).map(
      (fieldId) => {
        if (String(fieldId).startsWith("col:")) {
          return (
            packingColumnOptions.find((option) => option.value === fieldId)?.label || fieldId
          );
        }
        if (String(fieldId).startsWith("field:")) {
          const cleanFieldId = String(fieldId).slice(6);
          return (
            clientFields.find((field) => field.fieldId === cleanFieldId)?.name || cleanFieldId
          );
        }
        return fieldId;
      }
    ),
    "Tamanho",
    "Qtd",
    "Obs."
  ];

  return (
    <div style={{ fontSize: "11px", background: "#fff", padding: "8px", border: "1px solid #888" }}>
      <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "8px" }}>
        <strong>{form.layout.companyName || "FERMIR"}</strong>
        <span>{resolvePreviewValue(form.layout.topRightField, client, clientFields)}</span>
      </div>
      <div style={{ textAlign: "center", fontWeight: 700, marginBottom: "6px" }}>
        {form.layout.title || "LISTA DE CONTEÚDO / PACKING LIST"}
      </div>
      {(form.layout.headerFields || []).map((row, index) => (
        <div key={`preview_header_${index}`} style={{ marginBottom: "2px" }}>
          <strong>{row.label}: </strong>
          <span>{resolvePreviewValue(row.source, client, clientFields)}</span>
        </div>
      ))}
      <table style={{ width: "100%", borderCollapse: "collapse", marginTop: "8px" }}>
        <thead>
          <tr>
            {columns.map((col) => (
              <th key={col} style={previewCell}>
                {col}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          <tr>
            <td style={previewCell}>1-10</td>
            <td style={previewCell}>10</td>
            <td style={previewCell}>16</td>
            {(form.layout.detailFieldColumnIds || []).map((fieldId) => (
              <td key={`preview_col_${fieldId}`} style={previewCell}>
                V1
              </td>
            ))}
            <td style={previewCell}>XS</td>
            <td style={previewCell}>160</td>
            <td style={previewCell}></td>
          </tr>
          {Array.from({ length: Math.min(4, Number(form.layout.emptyRows) || 0) }).map(
            (_, index) => (
              <tr key={`empty_${index}`}>
                {columns.map((col) => (
                  <td key={`${col}_${index}`} style={previewCell}>
                    &nbsp;
                  </td>
                ))}
              </tr>
            )
          )}
        </tbody>
      </table>
      {form.layout.showSummary ? (
        <div style={{ marginTop: "8px", border: "1px solid #444", padding: "4px" }}>
          <strong>TABELA RESUMEN / SUMMARY TABLE</strong>
        </div>
      ) : null}
    </div>
  );
};

const previewCell = {
  border: "1px solid #666",
  padding: "2px 4px",
  textAlign: "center"
};

export default PackingTemplates;
