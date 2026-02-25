import React, { useEffect, useState } from "react";
import PackingListForm from "../CreatePackingList/PackingListForm";
import {
  fetchPackingLists,
  updatePackingList
} from "../../../api/packingLists";
import MessageModal from "../../Common/MessageModal";
import { normalizeClientLabelFields, normalizeLabelItems } from "../../../utils/labelFields";
import { Button, Card, Form } from "react-bootstrap";
import { openPrintLabelsWindow } from "../PrintLabels/printUtils";
import { openPrintPackingWindow } from "../PrintPacking/printPackingUtils";

// Ecrã para atualizar Packings existentes
const UpdatePackingList = (props) => {
  const [items, setItems] = useState([]);
  const [selectedId, setSelectedId] = useState(props.selectedId || "");
  const [selectedItem, setSelectedItem] = useState(null);
  const [po, setPo] = useState("");
  const [model, setModel] = useState("");
  // Estado do modal de feedback
  const [modal, setModal] = useState({
    show: false,
    title: "",
    message: ""
  });

  // Fecha o modal
  const closeModal = () => setModal({ show: false, title: "", message: "" });

  // Carrega as packing lists ao montar
  useEffect(() => {
    fetchPackingLists()
      .then((data) => {
        setItems(data);
      })
      .catch(() => {
        setModal({
          show: true,
          title: "Erro",
          message: "Erro ao carregar Packings."
        });
      });
  }, []);

  // Atualiza o item selecionado quando muda a seleção
  useEffect(() => {
    const found = items.find((item) => item._id === selectedId);
    setSelectedItem(found || null);
  }, [items, selectedId]);

  useEffect(() => {
    setPo(selectedItem?.po || "");
    setModel(selectedItem?.model || "");
  }, [selectedItem]);

  useEffect(() => {
    if (props.selectedId) setSelectedId(props.selectedId);
  }, [props.selectedId]);

  // Submete alterações do Packing
  const submitHandler = (payload) => {
    if (!selectedItem?._id) return;
    if (!po.trim()) {
      setModal({
        show: true,
        title: "Dados inválidos",
        message: "PO é obrigatório."
      });
      return;
    }
    updatePackingList(selectedItem._id, {
      ...payload,
      po: po.trim(),
      model: model.trim(),
      clientId: selectedItem.clientId?._id || selectedItem.clientId,
      sizeMatrixId: selectedItem.sizeMatrixId?._id || selectedItem.sizeMatrixId,
      labelItems: normalizeLabelItems(
        selectedItem.labelItems,
        normalizeClientLabelFields(selectedItem.clientId?.labelFields)
      )
    })
      .then(() => {
        setModal({
          show: true,
          title: "Sucesso",
          message: "Packing atualizado com sucesso."
        });
      })
      .catch(() => {
        setModal({
          show: true,
          title: "Erro",
          message: "Erro ao atualizar o Packing."
        });
      });
  };

  const sizeMatrix = selectedItem?.sizeMatrix || props.data;

  return (
    <Card className="pageSectionCard">
      <div className="d-flex align-items-center justify-content-between gap-2 mb-3 flex-wrap">
        <h3 className="mb-0">Atualizar Packing</h3>
        <div className="d-flex gap-2">
          <Button
            size="sm"
            variant="outline-dark"
            disabled={!selectedItem}
            onClick={() => selectedItem && openPrintLabelsWindow(selectedItem)}
          >
            Imprimir Rótulos
          </Button>
          <Button
            size="sm"
            variant="outline-secondary"
            disabled={!selectedItem}
            onClick={() => selectedItem && openPrintPackingWindow(selectedItem)}
          >
            Imprimir Packing
          </Button>
        </div>
      </div>
      {!props.selectedId ? (
        <Form.Group className="mb-3">
          <Form.Label htmlFor="packingListSelect">Selecionar Packing</Form.Label>
          <Form.Select
            id="packingListSelect"
            value={selectedId}
            onChange={(event) => setSelectedId(event.target.value)}
          >
            <option value="">-- selecione --</option>
            {items.map((item) => (
              <option key={item._id} value={item._id}>
                {item._id} ({new Date(item.createdAt).toLocaleString()})
              </option>
            ))}
          </Form.Select>
        </Form.Group>
      ) : null}
      {selectedItem ? (
        <>
          <div className="row g-3 mb-3">
            <div className="col-md-6">
              <Form.Label>PO</Form.Label>
              <Form.Control
                value={po}
                onChange={(event) => setPo(event.target.value)}
                placeholder="Pedido Original"
                isInvalid={!po.trim()}
              />
              {!po.trim() ? (
                <Form.Control.Feedback type="invalid">
                  PO é obrigatório.
                </Form.Control.Feedback>
              ) : null}
            </div>
            <div className="col-md-6">
              <Form.Label>Modelo</Form.Label>
              <Form.Control
                value={model}
                onChange={(event) => setModel(event.target.value)}
                placeholder="Modelo"
              />
            </div>
          </div>
          <PackingListForm
            data={sizeMatrix}
            initialEntries={selectedItem.entries}
            initialTotalUnits={selectedItem.totalUnits}
            onSubmit={submitHandler}
            onInvalid={() =>
              setModal({
                show: true,
                title: "Dados inválidos",
                message:
                  "Existem linhas inválidas. Verifique as caixas sobrepostas ou campos obrigatórios."
              })
            }
            submitLabel="Atualizar Packing"
            isSubmitDisabled={!po.trim()}
            labelFieldDefs={normalizeClientLabelFields(selectedItem.clientId?.labelFields)}
            labelItems={normalizeLabelItems(
              selectedItem.labelItems,
              normalizeClientLabelFields(selectedItem.clientId?.labelFields)
            )}
          />
        </>
      ) : (
        <p>Escolhe um Packing para editar.</p>
      )}
      <MessageModal
        show={modal.show}
        title={modal.title}
        message={modal.message}
        onClose={closeModal}
      />
    </Card>
  );
};

export default UpdatePackingList;
