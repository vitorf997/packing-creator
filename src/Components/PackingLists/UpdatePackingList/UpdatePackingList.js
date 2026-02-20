import React, { useEffect, useState } from "react";
import PackingListForm from "../CreatePackingList/PackingListForm";
import {
  fetchPackingLists,
  updatePackingList
} from "../../../api/packingLists";
import MessageModal from "../../Common/MessageModal";
import { normalizeClientLabelFields, normalizeLabelItems } from "../../../utils/labelFields";

// Ecrã para atualizar packing lists existentes
const UpdatePackingList = (props) => {
  const [items, setItems] = useState([]);
  const [selectedId, setSelectedId] = useState(props.selectedId || "");
  const [selectedItem, setSelectedItem] = useState(null);
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
          message: "Erro ao carregar packing lists."
        });
      });
  }, []);

  // Atualiza o item selecionado quando muda a seleção
  useEffect(() => {
    const found = items.find((item) => item._id === selectedId);
    setSelectedItem(found || null);
  }, [items, selectedId]);

  useEffect(() => {
    if (props.selectedId) setSelectedId(props.selectedId);
  }, [props.selectedId]);

  // Submete alterações da packing list
  const submitHandler = (payload) => {
    if (!selectedItem?._id) return;
    updatePackingList(selectedItem._id, {
      ...payload,
      po: selectedItem.po,
      model: selectedItem.model,
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
          message: "Packing list atualizada com sucesso."
        });
      })
      .catch(() => {
        setModal({
          show: true,
          title: "Erro",
          message: "Erro ao atualizar packing list."
        });
      });
  };

  const sizeMatrix = selectedItem?.sizeMatrix || props.data;

  return (
    <div>
      <h3>Atualizar Packing List</h3>
      {!props.selectedId ? (
        <div style={{ marginBottom: "16px" }}>
          <label htmlFor="packingListSelect">Selecionar packing list: </label>
          <select
            id="packingListSelect"
            value={selectedId}
            onChange={(event) => setSelectedId(event.target.value)}
            style={{ marginLeft: "8px" }}
          >
            <option value="">-- selecione --</option>
            {items.map((item) => (
              <option key={item._id} value={item._id}>
                {item._id} ({new Date(item.createdAt).toLocaleString()})
              </option>
            ))}
          </select>
        </div>
      ) : null}
      {selectedItem ? (
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
          labelFieldDefs={normalizeClientLabelFields(selectedItem.clientId?.labelFields)}
          labelItems={normalizeLabelItems(
            selectedItem.labelItems,
            normalizeClientLabelFields(selectedItem.clientId?.labelFields)
          )}
        />
      ) : (
        <p>Escolhe uma packing list para editar.</p>
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

export default UpdatePackingList;
