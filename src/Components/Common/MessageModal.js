import React from "react";
import { Modal, Button } from "react-bootstrap";

// Modal simples para mensagens informativas
const MessageModal = ({ show, title, message, onClose, confirmLabel }) => {
  return (
    <Modal show={show} onHide={onClose} centered>
      <Modal.Header closeButton>
        <Modal.Title>{title}</Modal.Title>
      </Modal.Header>
      <Modal.Body>{message}</Modal.Body>
      <Modal.Footer>
        <Button variant="primary" onClick={onClose}>
          {confirmLabel || "OK"}
        </Button>
      </Modal.Footer>
    </Modal>
  );
};

export default MessageModal;
