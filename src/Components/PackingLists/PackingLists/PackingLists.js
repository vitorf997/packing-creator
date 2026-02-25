import React, { useEffect, useState } from "react";
import { Button, Card, Form, Table } from "react-bootstrap";
import { deletePackingList, fetchPackingLists } from "../../../api/packingLists";
import ConfirmModal from "../../Common/ConfirmModal";
import MessageModal from "../../Common/MessageModal";
import { fetchClients } from "../../../api/clients";
import { fetchSizeMatrixes } from "../../../api/sizeMatrixes";
import { openPrintLabelsWindow } from "../PrintLabels/printUtils";
import { openPrintPackingWindow } from "../PrintPacking/printPackingUtils";

// Listagem de Packings
const PackingLists = ({ onNavigate }) => {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(false);
  const [confirm, setConfirm] = useState({ show: false, id: "" });
  const [search, setSearch] = useState("");
  const [filterClientId, setFilterClientId] = useState("");
  const [filterMatrixId, setFilterMatrixId] = useState("");
  const [clients, setClients] = useState([]);
  const [matrixes, setMatrixes] = useState([]);
  const [modal, setModal] = useState({
    show: false,
    title: "",
    message: ""
  });

  // Fecha o modal
  const closeModal = () => setModal({ show: false, title: "", message: "" });

  // Carrega listas do backend
  const loadItems = (query, clientId, matrixId) => {
    setLoading(true);
    fetchPackingLists({
      ...(query ? { q: query } : {}),
      ...(clientId ? { clientId } : {}),
      ...(matrixId ? { sizeMatrixId: matrixId } : {})
    })
      .then((data) => setItems(data))
      .catch(() => {
        setModal({
          show: true,
          title: "Erro",
          message: "Erro ao carregar Packings."
        });
      })
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    loadItems();
  }, []);

  useEffect(() => {
    const handle = setTimeout(() => {
      loadItems(search.trim(), filterClientId, filterMatrixId);
    }, 300);
    return () => clearTimeout(handle);
  }, [search, filterClientId, filterMatrixId]);

  useEffect(() => {
    fetchClients().then(setClients).catch(() => {});
    fetchSizeMatrixes().then(setMatrixes).catch(() => {});
  }, []);

  // Abre modal de confirmação
  const requestDelete = (id) => setConfirm({ show: true, id });

  // Confirma remoção no backend
  const confirmDelete = () => {
    const id = confirm.id;
    setConfirm({ show: false, id: "" });
    deletePackingList(id)
      .then(() => {
        setItems((prev) => prev.filter((item) => item._id !== id));
      })
      .catch(() => {
        setModal({
          show: true,
          title: "Erro",
          message: "Erro ao remover o Packing."
        });
      });
  };

  return (
    <Card className="pageSectionCard">
      <div className="pageHeaderRow">
        <h3 className="mb-0">Packings</h3>
      </div>
      <div className="pageFilters">
        <Form.Control
          className="filterInputSm"
          placeholder="Pesquisar por cliente/notas..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
        <Form.Select
          className="filterSelectSm"
          value={filterClientId}
          onChange={(e) => setFilterClientId(e.target.value)}
        >
          <option value="">Cliente: todos</option>
          {clients.map((c) => (
            <option key={c._id} value={c._id}>
              {c.name}
            </option>
          ))}
        </Form.Select>
        <Form.Select
          className="filterSelectSm"
          value={filterMatrixId}
          onChange={(e) => setFilterMatrixId(e.target.value)}
        >
          <option value="">Matriz: todas</option>
          {matrixes.map((m) => (
            <option key={m._id} value={m._id}>
              {m.name}
            </option>
          ))}
        </Form.Select>
        <Button
          onClick={() => loadItems(search.trim(), filterClientId, filterMatrixId)}
          disabled={loading}
          variant="outline-primary"
        >
          {loading ? "A carregar..." : "Recarregar"}
        </Button>
      </div>
      {items.length === 0 ? (
        <p className="mutedEmpty">Sem resultados.</p>
      ) : (
        <Table striped bordered hover responsive className="mb-0">
          <thead className="table-dark">
            <tr>
              <th>ID</th>
              <th>Cliente</th>
              <th>Matriz</th>
              <th>Total</th>
              <th>Criada</th>
              <th>Notas</th>
              <th>Ações</th>
            </tr>
          </thead>
          <tbody>
            {items.map((item) => (
              <tr key={item._id}>
                <td>{item._id}</td>
                <td>{item.clientId?.name || "-"}</td>
                <td>{item.sizeMatrixId?.name || "-"}</td>
                <td>{item.totalUnits}</td>
                <td>{new Date(item.createdAt).toLocaleString()}</td>
                <td>{item.notes || "-"}</td>
                <td>
                  <div className="actionsCell">
                  <Button
                    size="sm"
                    variant="outline-primary"
                    onClick={() =>
                      onNavigate?.("packing_edit", {
                        packingId: item._id,
                        backKey: "packing_list"
                      })
                    }
                  >
                    Editar
                  </Button>
                  <Button
                    size="sm"
                    variant="outline-dark"
                    onClick={() => openPrintLabelsWindow(item)}
                  >
                    Imprimir Rótulos
                  </Button>
                  <Button
                    size="sm"
                    variant="outline-secondary"
                    onClick={() => openPrintPackingWindow(item)}
                  >
                    Imprimir Packing
                  </Button>
                  <Button
                    size="sm"
                    variant="outline-danger"
                    onClick={() => requestDelete(item._id)}
                  >
                    Remover
                  </Button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </Table>
      )}
      <ConfirmModal
        show={confirm.show}
        title="Remover Packing"
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

export default PackingLists;
