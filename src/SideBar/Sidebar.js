import React from "react";

const Sidebar = () => {
  return (
    <div style={{ width: "200px", height: "100%", backgroundColor: "#eee" }}>
      <h1>Sidebar</h1>
      <ul>
        <li>
          <a href="/create-packing-list">Create Packing List</a>
        </li>
        <li>
          <a href="/update-packing-list">Update Packing List</a>
        </li>
        <li>
          <a href="/list-packing-lists">List Packing Lists</a>
        </li>
      </ul>
    </div>
  );
};

export default Sidebar;
