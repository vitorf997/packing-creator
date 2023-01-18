import React, { useState } from "react";
import "./App.css";
import Sidebar from "./Components/SideBar/Sidebar";
import Content from "./Components/Content/Content";

const DUMMY_DATA_SIZE_MATRIX = ["XS", "S", "M", "L", "XL", "XXL"];

function App() {
  const [selectedItem, setSelectedItem] = useState();
  const selectItemHandler = (itemNumber) => {
    setSelectedItem(itemNumber);
  };

  return (
    <div style={{ display: "flex" }}>
      <Sidebar onSelectItem={selectItemHandler} />
      <div style={{ width: "100%" }}>
        <Content data={DUMMY_DATA_SIZE_MATRIX} selectedItem={selectedItem} />
      </div>
    </div>
  );
}

export default App;
