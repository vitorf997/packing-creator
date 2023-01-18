import React, { useState } from "react";
import PackingListForm from "./PackingListForm";

const CreatePackingList = (props) => {
  return (
    <div>
      <PackingListForm data={props.data} />
    </div>
  );
};

export default CreatePackingList;
