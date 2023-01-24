import React, { useState } from "react";
import { Button, Table, Form, Card } from "react-bootstrap";
import styles from "./PackingListForm.module.css";
import PackingDataGeneration from "./PackingDataGeneration";

const PackingListForm = (props) => {
  const sizeObj = props.data.map((obj) => ({
    size: obj,
    boxFrom: 0,
    boxTo: 0,
    unitsPerBox: 0,
    remainBox: 0,
    remainUnits: 0,
    totalPerSize: 0,
  }));

  const [totalPerSize, setTotalPerSize] = useState(sizeObj);
  const [totalUnits, setTotalUnits] = useState(0);

  const submitFormHandler = (event) => {
    event.preventDefault();
  };

  const inputChangeHandler = (event, prefix, property) => {
    const updatedBoxFromPerSize = totalPerSize.map((obj) => {
      if (isInputValid(event.target.id, event.target.value, prefix, obj)) {
        return {
          ...obj,
          [property]: +event.target.value,
        };
      } else {
        return { ...obj, totalPerSize: 0 };
      }
    });
    setDataFromInputs(updatedBoxFromPerSize);
  };

  const boxFromChangeHandler = (event) => {
    inputChangeHandler(event, "box_from_input_", "boxFrom");
  };

  const boxToChangeHandler = (event) => {
    inputChangeHandler(event, "box_to_input_", "boxTo");
  };

  const qtyPerBoxChangeHandler = (event) => {
    inputChangeHandler(event, "units_per_box_input_", "unitsPerBox");
  };

  const remainBoxChangeHandler = (event) => {
    inputChangeHandler(event, "remain_box_input_", "remainBox");
  };

  const remainQtyChangeHandler = (event) => {
    inputChangeHandler(event, "remain_units_input_", "remainUnits");
  };

  const isInputValid = (eventId, eventValue, prefix, obj) => {
    return (
      prefix + obj.size === eventId &&
      eventValue.trim().length !== 0 &&
      +eventValue > 0
    );
  };

  const setDataFromInputs = (sizeObjects) => {
    console.log(sizeObjects);
    let total = 0;
    const updatedObjects = sizeObjects.map((obj) => {
      total =
        total +
        ((obj.boxTo - obj.boxFrom + 1) * obj.unitsPerBox + obj.remainUnits);
      return {
        ...obj,
        totalPerSize:
          (obj.boxTo - obj.boxFrom + 1) * obj.unitsPerBox + obj.remainUnits,
      };
    });
    setTotalUnits(total);
    setTotalPerSize(updatedObjects);
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
              {totalPerSize.map((size) => (
                <tr key={"tr_" + size.size}>
                  <td>
                    <label id={"size_" + size.size} key={"size_" + size.size}>
                      {size.size}
                    </label>
                  </td>
                  <td>
                    <input
                      type="number"
                      min="0"
                      onBlur={boxFromChangeHandler}
                      id={"box_from_input_" + size.size}
                      key={"box_from_input_" + size.size}
                    />
                  </td>
                  <td>
                    <input
                      type="number"
                      min="0"
                      onBlur={boxToChangeHandler}
                      id={"box_to_input_" + size.size}
                      key={"box_to_input_" + size.size}
                    />
                  </td>
                  <td>
                    <input
                      type="number"
                      min="0"
                      onBlur={qtyPerBoxChangeHandler}
                      id={"units_per_box_input_" + size.size}
                      key={"units_per_box_input_" + size.size}
                    />
                  </td>
                  <td>
                    <input
                      type="number"
                      min="0"
                      onBlur={remainBoxChangeHandler}
                      id={"remain_box_input_" + size.size}
                      key={"remain_box_input_" + size.size}
                    />
                  </td>
                  <td>
                    <input
                      type="number"
                      min="0"
                      onBlur={remainQtyChangeHandler}
                      id={"remain_units_input_" + size.size}
                      key={"remain_units_input_" + size.size}
                    />
                  </td>
                  <td>
                    <label
                      id={"total_units_label_" + size.size}
                      key={"total_units_label_" + size.size}
                    >
                      {size.totalPerSize}
                    </label>
                  </td>
                </tr>
              ))}
              <tr>
                <td colSpan={6}>Total</td>
                <td>{totalUnits}</td>
              </tr>
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
