import React, { useState } from "react";
import PackingListForm from "./PackingListForm";

const CreatePackingList = (props) => {
  return (
    <div>
      <div>
        <label>PO</label>
        <input />
      </div>
      <PackingListForm data={props.data} />
    </div>
  );
};

export default CreatePackingList;
