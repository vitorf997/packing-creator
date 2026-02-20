import React, { useState } from "react";
import { Button, Card, Form } from "react-bootstrap";
import { createSizeMatrix } from "../../api/sizeMatrixes";
import MessageModal from "../Common/MessageModal";

// Ecrã para criação de matriz de tamanhos
const CreateSizeMatrix = () => {
  const [form, setForm] = useState({ name: "", sizesText: "" });
  const [modal, setModal] = useState({
    show: false,
    title: "",
    message: ""
  });

  // Fecha o modal
  const closeModal = () => setModal({ show: false, title: "", message: "" });

  // Atualiza o formulário
  const onChange = (event) => {
    const { name, value } = event.target;
    setForm((prev) => ({ ...prev, [name]: value }));
  };

  // Submete a matriz
  const onSubmit = (event) => {
    event.preventDefault();
    const sizes = form.sizesText
      .split(",")
      .map((s) => s.trim())
      .filter(Boolean);

    if (!form.name.trim() || sizes.length === 0) {
      setModal({
        show: true,
        title: "Dados inválidos",
        message: "Nome e tamanhos são obrigatórios."
      });
      return;
    }

    createSizeMatrix({ name: form.name, sizes })
      .then(() => {
        setModal({
          show: true,
          title: "Sucesso",
          message: "Matriz criada com sucesso."
        });
        setForm({ name: "", sizesText: "" });
      })
      .catch(() => {
        setModal({
          show: true,
          title: "Erro",
          message: "Erro ao criar matriz."
        });
      });
  };

  return (
    <Card style={{ padding: "16px" }}>
      <h3>Criar Matriz de Tamanhos</h3>
      <Form onSubmit={onSubmit}>
        <Form.Group className="mb-3">
          <Form.Label>Nome</Form.Label>
          <Form.Control
            name="name"
            value={form.name}
            onChange={onChange}
            placeholder="Ex.: Tamanhos Primavera"
          />
        </Form.Group>
        <Form.Group className="mb-3">
          <Form.Label>Tamanhos (separados por vírgula)</Form.Label>
          <Form.Control
            name="sizesText"
            value={form.sizesText}
            onChange={onChange}
            placeholder="XS,S,M,L,XL"
          />
        </Form.Group>
        <Button type="submit" variant="primary">
          Guardar Matriz
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

export default CreateSizeMatrix;
