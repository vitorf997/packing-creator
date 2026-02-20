import React from "react";
import CreatePackingList from "../PackingLists/CreatePackingList/CreatePackingList";
import PackingLists from "../PackingLists/PackingLists/PackingLists";
import CreateClient from "../Clients/CreateClient/CreateClient";
import Clients from "../Clients/Clients/Clients";
import CreateSizeMatrix from "../CreateSizeMatrix/CreateSizeMatrix";
import SizesMatrixes from "../SizeMatrixes/SizesMatrixes/SizesMatrixes";
import LabelTemplates from "../LabelTemplates/LabelTemplates/LabelTemplates";

// Renderiza o conteúdo principal consoante o item selecionado
const Content = (props) => {
  let content = <CreatePackingList data={props.data} />;

  if (props.selectedItem === "packing_create") {
    content = <CreatePackingList data={props.data} />;
  } else if (props.selectedItem === "packing_list") {
    content = <PackingLists data={props.data} />;
  } else if (props.selectedItem === "client_create") {
    content = <CreateClient />;
  } else if (props.selectedItem === "client_list") {
    content = <Clients />;
  } else if (props.selectedItem === "size_create") {
    content = <CreateSizeMatrix />;
  } else if (props.selectedItem === "size_list") {
    content = <SizesMatrixes />;
  } else if (props.selectedItem === "label_templates") {
    content = <LabelTemplates />;
  }

  return <div>{content}</div>;
};

export default Content;
