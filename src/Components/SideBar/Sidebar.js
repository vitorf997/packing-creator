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

  const menuIcons = {
    packing: "📦",
    clients: "👥",
    sizes: "📏",
    labels: "🏷️"
  };

  const itemIcons = {
    packing_create: "＋",
    packing_list: "≣",
    client_create: "＋",
    client_list: "≣",
    size_create: "＋",
    size_list: "≣",
    label_templates: "◫",
    packing_templates: "▦"
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
      <div className={classes.section} key={menuKey}>
        <button
          type="button"
          className={classes.menuToggle}
          onClick={() => toggleMenu(menuKey)}
          title={title}
        >
          <span className={classes.menuLabel}>
            <span className={classes.menuIcon}>{menuIcons[menuKey] || "•"}</span>
            {!props.collapsed ? <span>{title}</span> : null}
          </span>
          {!props.collapsed ? (
            <span className={classes.menuArrow}>{isOpen ? "▾" : "▸"}</span>
          ) : null}
        </button>
        {isOpen ? (
          <ListGroup variant="flush" className={classes.list}>
            {items.map((item) => (
              <ListGroup.Item
                key={item.id}
                action
                active={isItemActive(item.id)}
                onClick={() => props.onSelectItem(item.id)}
                title={item.label}
              >
                <span className={classes.itemIcon}>{itemIcons[item.id] || "•"}</span>
                {!props.collapsed ? <span>{item.label}</span> : null}
              </ListGroup.Item>
            ))}
          </ListGroup>
        ) : null}
      </div>
    );
  };

  return (
    <div className={`${classes.sidebar} ${props.collapsed ? classes.collapsed : ""}`}>
      <Card className={classes.card}>
        <Card.Body className={classes.header}>
          <div className={classes.headerTop}>
            {!props.collapsed ? (
              <div>
                <Card.Title className={classes.title}>Packing Creator</Card.Title>
                <Card.Subtitle className={classes.subtitle}>
                  Gestão de listas
                </Card.Subtitle>
              </div>
            ) : (
              <Card.Title className={classes.title}>PC</Card.Title>
            )}
            <button
              type="button"
              className={classes.collapseBtn}
              onClick={props.onToggleCollapse}
              title={props.collapsed ? "Expandir sidebar" : "Colapsar sidebar"}
            >
              {props.collapsed ? "→" : "←"}
            </button>
          </div>
        </Card.Body>
        {renderMenu("packing", "Packings", [
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
          { id: "label_templates", label: "Layout Rótulos" },
          { id: "packing_templates", label: "Layout Packing" }
        ])}
      </Card>
    </div>
  );
};

export default Sidebar;
