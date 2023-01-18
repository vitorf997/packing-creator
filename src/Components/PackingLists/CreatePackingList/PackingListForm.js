import React, { useState } from "react";
import { Button, Table, Form, Card } from "react-bootstrap";
import styles from "./PackingListForm.module.css";
import PackingDataGeneration from "./PackingDataGeneration";

const PackingListForm = (props) => {
  const [totalPerSize, setTotalPerSize] = useState(0);

  const submitFormHandler = (event) => {
    event.preventDefault();
    const formElements = event.target.elements;
    for (let i = 0; i < formElements.length; i++) {
      if (
        formElements[i].tagName === "INPUT" &&
        formElements[i].value !== "" &&
        formElements[i].id.includes("box_from_input_")
      ) {
        console.log("in");
      }
    }
  };

  const qtyChangeHandler = (event) => {
    setTotalPerSize(event.target.value);
  };

  return (
    <Form className={`${styles["form-control"]}`} onSubmit={submitFormHandler}>
      <div>
        <Card>PACKING FORM</Card>
      </div>
      <div>
        <Card>
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
                    <label id={"size_" + size} key={"size_" + size}>
                      {size}
                    </label>
                  </td>
                  <td>
                    <input
                      onChange={qtyChangeHandler}
                      id={"box_from_input_" + size}
                      key={"box_from_input_" + size}
                    />
                  </td>
                  <td>
                    <input
                      id={"box_to_input_" + size}
                      key={"box_to_input_" + size}
                    />
                  </td>
                  <td>
                    <input
                      id={"units_p_box_input_" + size}
                      key={"units_p_box_input_" + size}
                    />
                  </td>
                  <td>
                    <input
                      id={"remain_box_input_" + size}
                      key={"remain_box_input_" + size}
                    />
                  </td>
                  <td>
                    <input
                      id={"units_remain_input_" + size}
                      key={"units_remain_input_" + size}
                    />
                  </td>
                  <td>
                    <label
                      id={"total_units_label_" + size}
                      key={"total_units_label_" + size}
                    >
                      {totalPerSize}
                    </label>
                  </td>
                </tr>
              ))}
            </tbody>
          </Table>
        </Card>
      </div>
      <Button variant="primary" type={"submit"}>
        Gerar Packing
      </Button>
    </Form>
  );
};

export default PackingListForm;
