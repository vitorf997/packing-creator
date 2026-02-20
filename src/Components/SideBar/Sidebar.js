import React, { useState } from "react";
import { Card, ListGroup } from "react-bootstrap";
import classes from "./Sidebar.module.css";

// Sidebar de navegação principal
const Sidebar = (props) => {
  const [openMenus, setOpenMenus] = useState({
    packing: true,
    clients: true,
    sizes: true,
    labels: true
  });

  const toggleMenu = (key) => {
    setOpenMenus((prev) => ({ ...prev, [key]: !prev[key] }));
  };

  const renderMenu = (menuKey, title, items) => {
    const isOpen = openMenus[menuKey];
    const isItemActive = (id) => {
      if (props.selectedItem === id) return true;
      if (id === "packing_list" && props.selectedItem === "packing_edit") return true;
      if (id === "client_list" && props.selectedItem === "client_edit") return true;
      if (id === "size_list" && props.selectedItem === "size_edit") return true;
      return false;
    };
    return (
      <div className={classes.section}>
        <button
          type="button"
          className={classes.menuToggle}
          onClick={() => toggleMenu(menuKey)}
        >
          <span>{title}</span>
          <span className={classes.menuArrow}>{isOpen ? "▾" : "▸"}</span>
        </button>
        {isOpen ? (
          <ListGroup variant="flush" className={classes.list}>
            {items.map((item) => (
              <ListGroup.Item
                key={item.id}
                action
                active={isItemActive(item.id)}
                onClick={() => props.onSelectItem(item.id)}
              >
                {item.label}
              </ListGroup.Item>
            ))}
          </ListGroup>
        ) : null}
      </div>
    );
  };

  return (
    <div className={classes.sidebar}>
      <Card className={classes.card}>
        <Card.Body className={classes.header}>
          <Card.Title className={classes.title}>Packing Creator</Card.Title>
          <Card.Subtitle className={classes.subtitle}>
            Gestão de listas
          </Card.Subtitle>
        </Card.Body>
        {renderMenu("packing", "Packing Lists", [
          { id: "packing_create", label: "Criar" },
          { id: "packing_list", label: "Ver / Editar" }
        ])}
        {renderMenu("clients", "Clientes", [
          { id: "client_create", label: "Criar" },
          { id: "client_list", label: "Ver / Editar" }
        ])}
        {renderMenu("sizes", "Matrizes", [
          { id: "size_create", label: "Criar" },
          { id: "size_list", label: "Ver / Editar" }
        ])}
        {renderMenu("labels", "Etiquetas", [
          { id: "label_templates", label: "Layouts" }
        ])}
      </Card>
    </div>
  );
};

export default Sidebar;
