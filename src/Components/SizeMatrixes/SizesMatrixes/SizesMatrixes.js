import React, { useEffect, useState } from "react";
import { Button, Form, Table } from "react-bootstrap";
import {
  deleteSizeMatrix,
  fetchSizeMatrixes,
  updateSizeMatrix
} from "../../../api/sizeMatrixes";
import ConfirmModal from "../../Common/ConfirmModal";
import MessageModal from "../../Common/MessageModal";

// Listagem de matrizes de tamanhos
const SizesMatrixes = () => {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(false);
  const [confirm, setConfirm] = useState({ show: false, id: "" });
  const [editingId, setEditingId] = useState("");
  const [draft, setDraft] = useState({ name: "", sizesText: "" });
  const [search, setSearch] = useState("");
  const [modal, setModal] = useState({
    show: false,
    title: "",
    message: ""
  });

  // Fecha o modal
  const closeModal = () => setModal({ show: false, title: "", message: "" });

  // Carrega matrizes
  const loadItems = (query) => {
    setLoading(true);
    fetchSizeMatrixes(query ? { q: query } : {})
      .then((data) => setItems(data))
      .catch(() => {
        setModal({
          show: true,
          title: "Erro",
          message: "Erro ao carregar matrizes."
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
    deleteSizeMatrix(id)
      .then(() => {
        setItems((prev) => prev.filter((item) => item._id !== id));
      })
      .catch(() => {
        setModal({
          show: true,
          title: "Erro",
          message: "Erro ao remover matriz."
        });
      });
  };

  // Inicia edição inline da matriz
  const startEdit = (item) => {
    setEditingId(item._id);
    setDraft({ name: item.name || "", sizesText: item.sizes.join(",") });
  };

  // Cancela edição da matriz
  const cancelEdit = () => {
    setEditingId("");
    setDraft({ name: "", sizesText: "" });
  };

  // Guarda alterações da matriz
  const saveEdit = (item) => {
    const sizes = draft.sizesText
      .split(",")
      .map((s) => s.trim())
      .filter(Boolean);
    if (!draft.name.trim() || sizes.length === 0) {
      setModal({
        show: true,
        title: "Dados inválidos",
        message: "Nome e tamanhos são obrigatórios."
      });
      return;
    }
    updateSizeMatrix(item._id, { name: draft.name, sizes })
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
          message: "Erro ao atualizar matriz."
        });
      });
  };

  return (
    <div>
      <h3>Matrizes de Tamanhos</h3>
      <div style={{ display: "flex", gap: "12px", marginBottom: "12px" }}>
        <Form.Control
          placeholder="Pesquisar por nome ou tamanhos..."
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
              <th>Tamanhos</th>
              <th>Criada</th>
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
                <td style={{ minWidth: "220px" }}>
                  {editingId === item._id ? (
                    <Form.Group>
                      <Form.Control
                        value={draft.sizesText}
                        onChange={(e) =>
                          setDraft((prev) => ({
                            ...prev,
                            sizesText: e.target.value
                          }))
                        }
                        isInvalid={!draft.sizesText.trim()}
                      />
                      <Form.Control.Feedback type="invalid">
                        Tamanhos obrigatórios.
                      </Form.Control.Feedback>
                    </Form.Group>
                  ) : (
                    item.sizes.join(", ")
                  )}
                </td>
                <td>{new Date(item.createdAt).toLocaleString()}</td>
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
        title="Remover matriz"
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

export default SizesMatrixes;
