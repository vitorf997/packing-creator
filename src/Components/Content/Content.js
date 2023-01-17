import React from "react";
import CreatePackingList from "../PackingLists/CreatePackingList/CreatePackingList";
import UpdatePackingList from "../PackingLists/UpdatePackingList/UpdatePackingList";
import PackingLists from "../PackingLists/PackingLists/PackingLists";

const Content = (props) => {
  let content = <CreatePackingList data={props.data} />;

  if (props.selectedItem === "i0") {
    content = <CreatePackingList data={props.data} />;
  } else if (props.selectedItem === "i1") {
    content = <UpdatePackingList data={props.data} />;
  } else if (props.selectedItem === "i2") {
    content = <PackingLists data={props.data} />;
  }

  return <div>{content}</div>;
};

export default Content;
