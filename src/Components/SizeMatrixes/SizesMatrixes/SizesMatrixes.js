import React, { useEffect, useState } from "react";
import { Button, Form, Table } from "react-bootstrap";
import {
  deleteSizeMatrix,
  fetchSizeMatrixes
} from "../../../api/sizeMatrixes";
import ConfirmModal from "../../Common/ConfirmModal";
import MessageModal from "../../Common/MessageModal";

// Listagem de matrizes de tamanhos
const SizesMatrixes = ({ onNavigate }) => {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(false);
  const [confirm, setConfirm] = useState({ show: false, id: "" });
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

  useEffect(() => {
    loadItems();
  }, []);

  useEffect(() => {
    const handle = setTimeout(() => {
      loadItems(search.trim());
    }, 300);
    return () => clearTimeout(handle);
  }, [search]);

  // Abre confirmação de remoção
  const requestDelete = (id) => setConfirm({ show: true, id });

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
                <td>{item.name}</td>
                <td>{item.sizes.join(", ")}</td>
                <td>{new Date(item.createdAt).toLocaleString()}</td>
                <td>
                  <Button
                    size="sm"
                    variant="outline-primary"
                    onClick={() =>
                      onNavigate?.("size_edit", {
                        sizeMatrixId: item._id,
                        backKey: "size_list"
                      })
                    }
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
