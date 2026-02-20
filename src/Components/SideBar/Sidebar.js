import React from "react";
import { Card, ListGroup } from "react-bootstrap";
import classes from "./Sidebar.module.css";

// Sidebar de navegação principal
const Sidebar = (props) => {
  // Notifica o item selecionado
  const clickHandler = (event) => {
    props.onSelectItem(event.target.id);
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
        <div className={classes.section}>
          <div className={classes.sectionTitle}>Packing Lists</div>
          <ListGroup variant="flush" className={classes.list}>
            <ListGroup.Item
              id={"packing_create"}
              action
              active={
                props.selectedItem === "packing_create" || !props.selectedItem
              }
              onClick={clickHandler}
            >
              Criar
            </ListGroup.Item>
            <ListGroup.Item
              id={"packing_list"}
              action
              active={props.selectedItem === "packing_list"}
              onClick={clickHandler}
            >
              Ver / Editar
            </ListGroup.Item>
          </ListGroup>
        </div>
        <div className={classes.section}>
          <div className={classes.sectionTitle}>Clientes</div>
          <ListGroup variant="flush" className={classes.list}>
            <ListGroup.Item
              id={"client_create"}
              action
              active={props.selectedItem === "client_create"}
              onClick={clickHandler}
            >
              Criar
            </ListGroup.Item>
            <ListGroup.Item
              id={"client_list"}
              action
              active={props.selectedItem === "client_list"}
              onClick={clickHandler}
            >
              Ver / Editar
            </ListGroup.Item>
          </ListGroup>
        </div>
        <div className={classes.section}>
          <div className={classes.sectionTitle}>Matrizes</div>
          <ListGroup variant="flush" className={classes.list}>
            <ListGroup.Item
              id={"size_create"}
              action
              active={props.selectedItem === "size_create"}
              onClick={clickHandler}
            >
              Criar
            </ListGroup.Item>
            <ListGroup.Item
              id={"size_list"}
              action
              active={props.selectedItem === "size_list"}
              onClick={clickHandler}
            >
              Ver / Editar
            </ListGroup.Item>
          </ListGroup>
        </div>
        <div className={classes.section}>
          <div className={classes.sectionTitle}>Etiquetas</div>
          <ListGroup variant="flush" className={classes.list}>
            <ListGroup.Item
              id={"label_templates"}
              action
              active={props.selectedItem === "label_templates"}
              onClick={clickHandler}
            >
              Layouts
            </ListGroup.Item>
          </ListGroup>
        </div>
      </Card>
    </div>
  );
};

export default Sidebar;
