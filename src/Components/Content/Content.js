import React from "react";
import CreatePackingList from "../PackingLists/CreatePackingList/CreatePackingList";
import PackingLists from "../PackingLists/PackingLists/PackingLists";
import CreateClient from "../Clients/CreateClient/CreateClient";
import Clients from "../Clients/Clients/Clients";
import CreateSizeMatrix from "../CreateSizeMatrix/CreateSizeMatrix";
import SizesMatrixes from "../SizeMatrixes/SizesMatrixes/SizesMatrixes";
import LabelTemplates from "../LabelTemplates/LabelTemplates/LabelTemplates";
import UpdateClient from "../Clients/UpdateClient/UpdateClient";
import UpdateSizeMatrix from "../SizeMatrixes/UpdateSizeMatrix/UpdateSizeMatrix";
import UpdatePackingList from "../PackingLists/UpdatePackingList/UpdatePackingList";

// Renderiza o conteúdo principal consoante o item selecionado
const Content = (props) => {
  let content = <CreatePackingList data={props.data} />;

  if (props.selectedItem === "packing_create") {
    content = <CreatePackingList data={props.data} />;
  } else if (props.selectedItem === "packing_list") {
    content = <PackingLists data={props.data} onNavigate={props.onNavigate} />;
  } else if (props.selectedItem === "packing_edit") {
    content = (
      <UpdatePackingList
        data={props.data}
        selectedId={props.viewParams?.packingId}
      />
    );
  } else if (props.selectedItem === "client_create") {
    content = <CreateClient />;
  } else if (props.selectedItem === "client_list") {
    content = <Clients onNavigate={props.onNavigate} />;
  } else if (props.selectedItem === "client_edit") {
    content = <UpdateClient selectedId={props.viewParams?.clientId} />;
  } else if (props.selectedItem === "size_create") {
    content = <CreateSizeMatrix />;
  } else if (props.selectedItem === "size_list") {
    content = <SizesMatrixes onNavigate={props.onNavigate} />;
  } else if (props.selectedItem === "size_edit") {
    content = <UpdateSizeMatrix selectedId={props.viewParams?.sizeMatrixId} />;
  } else if (props.selectedItem === "label_templates") {
    content = <LabelTemplates />;
  }

  return <div>{content}</div>;
};

export default Content;
