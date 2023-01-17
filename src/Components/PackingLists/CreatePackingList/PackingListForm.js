import React, { useState } from "react";
import { Button, Table, Form } from "react-bootstrap";

const PackingListForm = (props) => {
  const [totalPerSize, setTotalPerSize] = useState();

  const submitFormHandler = (event) => {
    event.preventDefault();
    console.log(event.target[0].value);
  };

  return (
    <Form onSubmit={submitFormHandler}>
      <Table striped bordered hover variant="dark">
        <thead>
          <tr>
            <td key={"size_label"}>Size</td>
            <td key={"box_from_label"}>Caixa "De"</td>
            <td key={"box_to_label"}>Caixa "Até"</td>
            <td key={"units_p_box_label"}>Quantidade p/ caixa</td>
            <td key={"remain_box_label"}>Caixa de Restos</td>
            <td key={"units_remain_label"}>Quantidade de restos</td>
            <td key={"total_units_label"}>Total</td>
          </tr>
        </thead>
        <tbody>
          {props.data.map((size) => (
            <tr key={"tr_" + size}>
              <td>
                <label key={"size_" + size}>{size}</label>
              </td>
              <td>
                <input key={"box_from_input_" + size} />
              </td>
              <td>
                <input key={"box_to_input_" + size} />
              </td>
              <td>
                <input key={"units_p_box_input_" + size} />
              </td>
              <td>
                <input key={"remain_box_input_" + size} />
              </td>
              <td>
                <input key={"units_remain_input_" + size} />
              </td>
              <td>
                <label key={"total_units_label_" + size}>{totalPerSize}</label>
              </td>
            </tr>
          ))}
        </tbody>
      </Table>
      <Button variant="primary" type={"submit"}>
        Gerar Packing
      </Button>
    </Form>
  );
};

export default PackingListForm;
