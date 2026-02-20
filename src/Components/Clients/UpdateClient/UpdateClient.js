import React, { useEffect, useState } from "react";
import { Button, Form } from "react-bootstrap";
import { fetchClients, updateClient } from "../../../api/clients";
import MessageModal from "../../Common/MessageModal";
import { fetchLabelTemplates } from "../../../api/labelTemplates";
import { createLabelField, normalizeClientLabelFields } from "../../../utils/labelFields";

// Ecrã para atualizar cliente
const UpdateClient = (props) => {
  const [items, setItems] = useState([]);
  const [selectedId, setSelectedId] = useState(props.selectedId || "");
  const [form, setForm] = useState({
    name: "",
    code: "",
    contact: "",
    notes: "",
    labelTemplateId: "",
    labelFields: []
  });
  const [templates, setTemplates] = useState([]);
  const [modal, setModal] = useState({
    show: false,
    title: "",
    message: ""
  });

  // Fecha o modal
  const closeModal = () => setModal({ show: false, title: "", message: "" });

  // Carrega clientes ao montar
  useEffect(() => {
    fetchClients()
      .then((data) => setItems(data))
      .catch(() => {
        setModal({
          show: true,
          title: "Erro",
          message: "Erro ao carregar clientes."
        });
      });
    fetchLabelTemplates({ active: true }).then(setTemplates).catch(() => {});
  }, []);

  useEffect(() => {
    if (props.selectedId) setSelectedId(props.selectedId);
  }, [props.selectedId]);

  useEffect(() => {
    fetchLabelTemplates(
      selectedId ? { active: true, clientId: selectedId } : { active: true }
    )
      .then(setTemplates)
      .catch(() => {});
  }, [selectedId]);

  // Atualiza formulário quando muda seleção
  useEffect(() => {
    const selected = items.find((item) => item._id === selectedId);
    if (!selected) return;
    setForm({
      name: selected.name || "",
      code: selected.code || "",
      contact: selected.contact || "",
      notes: selected.notes || "",
      labelTemplateId: selected.labelTemplateId?._id || "",
      labelFields: normalizeClientLabelFields(selected.labelFields)
    });
  }, [items, selectedId]);

  // Atualiza estado do formulário
  const onChange = (event) => {
    const { name, value } = event.target;
    setForm((prev) => ({ ...prev, [name]: value }));
  };
  const onLabelFieldChange = (fieldId, value) => {
    setForm((prev) => ({
      ...prev,
      labelFields: prev.labelFields.map((field) =>
        field.fieldId === fieldId ? { ...field, name: value } : field
      )
    }));
  };
  const addLabelField = () => {
    setForm((prev) => ({
      ...prev,
      labelFields: [...prev.labelFields, createLabelField(prev.labelFields.length)]
    }));
  };
  const removeLabelField = (fieldId) => {
    setForm((prev) => ({
      ...prev,
      labelFields: prev.labelFields.filter((field) => field.fieldId !== fieldId)
    }));
  };

  // Submete alterações
  const onSubmit = (event) => {
    event.preventDefault();
    if (!selectedId) return;
    if (!form.name.trim()) {
      setModal({
        show: true,
        title: "Dados inválidos",
        message: "O nome do cliente é obrigatório."
      });
      return;
    }
    updateClient(selectedId, {
      ...form,
      labelFields: normalizeClientLabelFields(form.labelFields)
    })
      .then(() => {
        setModal({
          show: true,
          title: "Sucesso",
          message: "Cliente atualizado com sucesso."
        });
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
      <h3>Atualizar Cliente</h3>
      {!props.selectedId ? (
        <Form.Group className="mb-3">
          <Form.Label>Selecionar cliente</Form.Label>
          <Form.Select
            value={selectedId}
            onChange={(e) => setSelectedId(e.target.value)}
          >
            <option value="">-- selecione --</option>
            {items.map((item) => (
              <option key={item._id} value={item._id}>
                {item.name} ({item.code || "sem código"})
              </option>
            ))}
          </Form.Select>
        </Form.Group>
      ) : null}

      {selectedId ? (
        <Form onSubmit={onSubmit}>
          <Form.Group className="mb-3">
            <Form.Label>Nome</Form.Label>
            <Form.Control name="name" value={form.name} onChange={onChange} />
          </Form.Group>
          <Form.Group className="mb-3">
            <Form.Label>Código</Form.Label>
            <Form.Control name="code" value={form.code} onChange={onChange} />
          </Form.Group>
          <Form.Group className="mb-3">
            <Form.Label>Contacto</Form.Label>
            <Form.Control
              name="contact"
              value={form.contact}
              onChange={onChange}
            />
          </Form.Group>
          <Form.Group className="mb-3">
            <Form.Label>Notas</Form.Label>
            <Form.Control name="notes" value={form.notes} onChange={onChange} />
          </Form.Group>
          <Form.Group className="mb-3">
            <Form.Label>Layout de Etiqueta</Form.Label>
            <Form.Select
              name="labelTemplateId"
              value={form.labelTemplateId}
              onChange={onChange}
            >
              <option value="">Default global</option>
              {templates
                .filter(
                  (template) =>
                    !template.clientId || template.clientId?._id === selectedId
                )
                .map((template) => (
                <option key={template._id} value={template._id}>
                  {template.name}
                </option>
                ))}
            </Form.Select>
          </Form.Group>
          <h5 className="mt-4 mb-3">Campos do Rótulo</h5>
          {form.labelFields.map((field, index) => (
            <div
              key={field.fieldId}
              className="d-flex gap-2 align-items-center mb-2"
            >
              <Form.Control
                value={field.name}
                onChange={(event) =>
                  onLabelFieldChange(field.fieldId, event.target.value)
                }
                placeholder={`Campo ${index + 1}`}
              />
              <Button
                variant="outline-danger"
                onClick={() => removeLabelField(field.fieldId)}
              >
                Remover
              </Button>
            </div>
          ))}
          <div className="mb-3">
            <Button variant="outline-secondary" onClick={addLabelField}>
              + Adicionar campo
            </Button>
          </div>
          <Button type="submit" variant="primary">
            Guardar Alterações
          </Button>
        </Form>
      ) : (
        <p>Escolhe um cliente para editar.</p>
      )}

      <MessageModal
        show={modal.show}
        title={modal.title}
        message={modal.message}
        onClose={closeModal}
      />
    </div>
  );
};

export default UpdateClient;
