import React from "react";
import classes from "./Sidebar.module.css";

const Sidebar = (props) => {
  const clickHandler = (event) => {
    props.onSelectItem(event.target.id);
  };
  return (
    <div className={classes.sidebar}>
      <h1>Sidebar</h1>
      <ul>
        <li id={"i0"} onClick={clickHandler}>
          Create Packing List
        </li>
        <li id={"i1"} onClick={clickHandler}>
          Update Packing List
        </li>
        <li id={"i2"} onClick={clickHandler}>
          List Packing Lists
        </li>
      </ul>
    </div>
  );
};

export default Sidebar;
