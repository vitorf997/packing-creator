import React, { useEffect, useState } from "react";
import { Button, Form } from "react-bootstrap";
import { fetchSizeMatrixes, updateSizeMatrix } from "../../../api/sizeMatrixes";
import MessageModal from "../../Common/MessageModal";

// Ecrã para atualizar matriz de tamanhos
const UpdateSizeMatrix = (props) => {
  const [items, setItems] = useState([]);
  const [selectedId, setSelectedId] = useState(props.selectedId || "");
  const [form, setForm] = useState({ name: "", sizesText: "" });
  const [modal, setModal] = useState({
    show: false,
    title: "",
    message: ""
  });

  // Fecha o modal
  const closeModal = () => setModal({ show: false, title: "", message: "" });

  // Carrega matrizes
  useEffect(() => {
    fetchSizeMatrixes()
      .then((data) => setItems(data))
      .catch(() => {
        setModal({
          show: true,
          title: "Erro",
          message: "Erro ao carregar matrizes."
        });
      });
  }, []);

  // Atualiza formulário quando muda seleção
  useEffect(() => {
    if (props.selectedId) setSelectedId(props.selectedId);
  }, [props.selectedId]);

  useEffect(() => {
    const selected = items.find((item) => item._id === selectedId);
    if (!selected) return;
    setForm({ name: selected.name, sizesText: selected.sizes.join(",") });
  }, [items, selectedId]);

  // Atualiza estado do formulário
  const onChange = (event) => {
    const { name, value } = event.target;
    setForm((prev) => ({ ...prev, [name]: value }));
  };

  // Submete alterações
  const onSubmit = (event) => {
    event.preventDefault();
    if (!selectedId) return;
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

    updateSizeMatrix(selectedId, { name: form.name, sizes })
      .then(() => {
        setModal({
          show: true,
          title: "Sucesso",
          message: "Matriz atualizada com sucesso."
        });
      })
      .catch(() => {
        setModal({
          show: true,
          title: "Erro",
          message: "Erro ao atualizar matriz."
        });
      });
  };

  return (
    <div>
      <h3>Atualizar Matriz de Tamanhos</h3>
      {!props.selectedId ? (
        <Form.Group className="mb-3">
          <Form.Label>Selecionar matriz</Form.Label>
          <Form.Select
            value={selectedId}
            onChange={(e) => setSelectedId(e.target.value)}
          >
            <option value="">-- selecione --</option>
            {items.map((item) => (
              <option key={item._id} value={item._id}>
                {item.name}
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
            <Form.Label>Tamanhos (separados por vírgula)</Form.Label>
            <Form.Control
              name="sizesText"
              value={form.sizesText}
              onChange={onChange}
            />
          </Form.Group>
          <Button type="submit" variant="primary">
            Guardar Alterações
          </Button>
        </Form>
      ) : (
        <p>Escolhe uma matriz para editar.</p>
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

export default UpdateSizeMatrix;
