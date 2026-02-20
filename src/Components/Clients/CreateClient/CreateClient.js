import React, { useState } from "react";
import { Button, Form, Card } from "react-bootstrap";
import { createClient } from "../../../api/clients";
import MessageModal from "../../Common/MessageModal";
import { fetchLabelTemplates } from "../../../api/labelTemplates";
import { createLabelField, normalizeClientLabelFields } from "../../../utils/labelFields";

// Ecrã para criar cliente
const CreateClient = () => {
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

  // Atualiza o estado do formulário
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

  React.useEffect(() => {
    fetchLabelTemplates({ active: true })
      .then((data) => setTemplates(data))
      .catch(() => {});
  }, []);

  // Fecha o modal
  const closeModal = () => setModal({ show: false, title: "", message: "" });

  // Submete o formulário
  const onSubmit = (event) => {
    event.preventDefault();
    if (!form.name.trim()) {
      setModal({
        show: true,
        title: "Dados inválidos",
        message: "O nome do cliente é obrigatório."
      });
      return;
    }
    const payload = {
      ...form,
      labelFields: normalizeClientLabelFields(form.labelFields)
    };
    createClient(payload)
      .then(() => {
        setModal({
          show: true,
          title: "Sucesso",
          message: "Cliente criado com sucesso."
        });
        setForm({
          name: "",
          code: "",
          contact: "",
          notes: "",
          labelTemplateId: "",
          labelFields: []
        });
      })
      .catch(() => {
        setModal({
          show: true,
          title: "Erro",
          message: "Erro ao criar cliente."
        });
      });
  };

  return (
    <Card style={{ padding: "16px" }}>
      <h3>Criar Cliente</h3>
      <Form onSubmit={onSubmit}>
        <Form.Group className="mb-3">
          <Form.Label>Nome</Form.Label>
          <Form.Control
            name="name"
            value={form.name}
            onChange={onChange}
            placeholder="Nome do cliente"
          />
        </Form.Group>
        <Form.Group className="mb-3">
          <Form.Label>Código</Form.Label>
          <Form.Control
            name="code"
            value={form.code}
            onChange={onChange}
            placeholder="Código interno"
          />
        </Form.Group>
        <Form.Group className="mb-3">
          <Form.Label>Contacto</Form.Label>
          <Form.Control
            name="contact"
            value={form.contact}
            onChange={onChange}
            placeholder="Email/telefone"
          />
        </Form.Group>
        <Form.Group className="mb-3">
          <Form.Label>Notas</Form.Label>
          <Form.Control
            name="notes"
            value={form.notes}
            onChange={onChange}
            placeholder="Observações"
          />
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
              .filter((template) => !template.clientId)
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
          Guardar Cliente
        </Button>
      </Form>
      <MessageModal
        show={modal.show}
        title={modal.title}
        message={modal.message}
        onClose={closeModal}
      />
    </Card>
  );
};

export default CreateClient;
