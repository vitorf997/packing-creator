import React, { useEffect, useState } from "react";
import { Button, Form, Table } from "react-bootstrap";
import { deleteClient, fetchClients } from "../../../api/clients";
import ConfirmModal from "../../Common/ConfirmModal";
import MessageModal from "../../Common/MessageModal";
import { normalizeClientLabelFields } from "../../../utils/labelFields";

// Listagem de clientes
const Clients = ({ onNavigate }) => {
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
                <td>{item.name}</td>
                <td>{item.code || "-"}</td>
                <td>{item.contact || "-"}</td>
                <td>{item.notes || "-"}</td>
                <td>{item.labelTemplateId?.name || "Default global"}</td>
                <td style={{ minWidth: "220px", fontSize: "12px" }}>
                  {normalizeClientLabelFields(item.labelFields).length === 0
                    ? "-"
                    : normalizeClientLabelFields(item.labelFields).map((field) => (
                        <div key={field.fieldId}>{field.name}</div>
                      ))}
                </td>
                <td>
                  <Button
                    size="sm"
                    variant="outline-primary"
                    onClick={() =>
                      onNavigate?.("client_edit", {
                        clientId: item._id,
                        backKey: "client_list"
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
