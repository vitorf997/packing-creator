import React, { useEffect, useMemo, useState } from "react";
import { Button, Table, Form, Card } from "react-bootstrap";
import styles from "./PackingListForm.module.css";
import PackingDataGeneration from "./PackingDataGeneration";

const PackingListForm = (props) => {
  const sizeObj = useMemo(
    () =>
      props.data.map((obj) => ({
        size: obj,
        boxFrom: 0,
        boxTo: 0,
        unitsPerBox: 0,
        remainBox: 0,
        remainUnits: 0,
        totalPerSize: 0,
      })),
    [props.data]
  );

  const [totalPerSize, setTotalPerSize] = useState(sizeObj);
  const [totalUnits, setTotalUnits] = useState(0);

  useEffect(() => {
    setTotalPerSize(sizeObj);
    setTotalUnits(0);
  }, [sizeObj]);

  const submitFormHandler = (event) => {
    event.preventDefault();
  };

  const inputChangeHandler = (event, prefix, property) => {
    const { id, value } = event.target;
    const numValue = parseNumber(value);
    const updatedBoxFromPerSize = totalPerSize.map((obj) => {
      if (prefix + obj.size !== id) return obj;
      const candidate = { ...obj, [property]: numValue };
      if (!isInputValid(prefix, candidate)) {
        return { ...candidate, totalPerSize: 0 };
      }
      return candidate;
    });
    setDataFromInputs(updatedBoxFromPerSize);
  };

  const parseNumber = (value) => {
    const trimmed = value.trim();
    if (trimmed === "") return 0;
    const parsed = Number(trimmed);
    return Number.isNaN(parsed) ? 0 : parsed;
  };

  const isValidRange = (obj) => {
    return obj.boxFrom > 0 && obj.boxTo > 0 && obj.boxTo >= obj.boxFrom;
  };

  const rangesOverlap = (aFrom, aTo, bFrom, bTo) => {
    return aFrom <= bTo && bFrom <= aTo;
  };

  const isRangeOverlapping = (candidate, allRows = totalPerSize) => {
    if (!isValidRange(candidate)) return false;
    return allRows.some((obj) => {
      if (obj.size === candidate.size || !isValidRange(obj)) return false;
      return rangesOverlap(
        candidate.boxFrom,
        candidate.boxTo,
        obj.boxFrom,
        obj.boxTo
      );
    });
  };

  const isBoxNumberInUse = (value, candidate, allRows = totalPerSize) => {
    if (value <= 0) return false;
    if (isValidRange(candidate)) {
      if (value >= candidate.boxFrom && value <= candidate.boxTo) return true;
    }
    return allRows.some((obj) => {
      if (obj.size === candidate.size || !isValidRange(obj)) return false;
      return value >= obj.boxFrom && value <= obj.boxTo;
    });
  };

  const isInputValid = (prefix, obj) => {
    if (prefix === "box_from_input_") {
      if (obj.boxFrom <= 0) return true;
      if (obj.boxTo > 0 && obj.boxTo < obj.boxFrom) return false;
      if (isRangeOverlapping(obj)) return false;
      return true;
    } else if (prefix === "box_to_input_") {
      if (obj.boxTo <= 0) return true;
      if (obj.boxFrom > 0 && obj.boxTo < obj.boxFrom) return false;
      if (isRangeOverlapping(obj)) return false;
      return true;
    } else if (prefix === "units_per_box_input_") {
      return true;
    } else if (prefix === "remain_box_input_") {
      if (obj.remainBox <= 0) return true;
      if (isBoxNumberInUse(obj.remainBox, obj)) return false;
      return true;
    } else if (prefix === "remain_units_input_") {
      if (obj.remainUnits <= 0) return true;
      if (obj.remainBox <= 0) return false;
      if (isBoxNumberInUse(obj.remainBox, obj)) return false;
      return true;
    }

    return false;
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

  const isRowValid = (obj, allRows) => {
    if (obj.boxFrom < 0 || obj.boxTo < 0 || obj.unitsPerBox < 0) return false;
    if (obj.remainBox < 0 || obj.remainUnits < 0) return false;
    if (obj.boxFrom > 0 || obj.boxTo > 0) {
      if ((obj.boxFrom > 0) !== (obj.boxTo > 0)) return true;
      if (!isValidRange(obj)) return false;
      if (isRangeOverlapping(obj, allRows)) return false;
    }
    if (obj.remainUnits > 0 && obj.remainBox <= 0) return false;
    if (obj.remainBox > 0 && isBoxNumberInUse(obj.remainBox, obj, allRows)) {
      return false;
    }
    return true;
  };

  const setDataFromInputs = (sizeObjects) => {
    let total = 0;
    const updatedObjects = sizeObjects.map((obj) => {
      const rowValid = isRowValid(obj, sizeObjects);
      if (!rowValid) {
        return { ...obj, totalPerSize: 0 };
      }
      if (!isValidRange(obj) || obj.unitsPerBox <= 0) {
        return { ...obj, totalPerSize: 0 };
      }
      const rowTotal =
        (obj.boxTo - obj.boxFrom + 1) * obj.unitsPerBox + obj.remainUnits;
      total += rowTotal;
      return { ...obj, totalPerSize: rowTotal };
    });
    setTotalUnits(total);
    setTotalPerSize(updatedObjects);
    console.log("OBJ: ", updatedObjects);
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
              {totalPerSize.map((size) => {
                const rowValid = isRowValid(size, totalPerSize);
                const inputClass = rowValid ? "" : styles.invalidInput;
                return (
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
                      className={inputClass}
                      id={"box_from_input_" + size.size}
                      key={"box_from_input_" + size.size}
                    />
                  </td>
                  <td>
                    <input
                      type="number"
                      min="0"
                      onBlur={boxToChangeHandler}
                      className={inputClass}
                      id={"box_to_input_" + size.size}
                      key={"box_to_input_" + size.size}
                    />
                  </td>
                  <td>
                    <input
                      type="number"
                      min="0"
                      onBlur={qtyPerBoxChangeHandler}
                      className={inputClass}
                      id={"units_per_box_input_" + size.size}
                      key={"units_per_box_input_" + size.size}
                    />
                  </td>
                  <td>
                    <input
                      type="number"
                      min="0"
                      onBlur={remainBoxChangeHandler}
                      className={inputClass}
                      id={"remain_box_input_" + size.size}
                      key={"remain_box_input_" + size.size}
                    />
                  </td>
                  <td>
                    <input
                      type="number"
                      min="0"
                      onBlur={remainQtyChangeHandler}
                      className={inputClass}
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
              )})}
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




