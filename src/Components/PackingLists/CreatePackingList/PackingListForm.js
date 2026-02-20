import React, { useEffect, useMemo, useRef, useState } from "react";
import { Button, Table, Form, Card } from "react-bootstrap";
import styles from "./PackingListForm.module.css";
import { normalizeLabelFieldValues, normalizeLabelItems } from "../../../utils/labelFields";

// Formulário principal de criação/edição de packing list
const PackingListForm = (props) => {
  const rowIdCounter = useRef(0);
  const labelItems = useMemo(
    () => normalizeLabelItems(props.labelItems || [], props.labelFieldDefs || []),
    [props.labelItems, props.labelFieldDefs]
  );
  const labelItemsStructureKey = useMemo(
    () => labelItems.map((item) => item.itemId).join("|"),
    [labelItems]
  );
  const labelItemsForRows = useMemo(
    () => normalizeLabelItems(props.labelItems || [], props.labelFieldDefs || []),
    // Recria linhas apenas quando a estrutura (add/remove) muda, não em cada edição de texto.
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [labelItemsStructureKey, props.labelFieldDefs]
  );

  const createRowId = () => {
    rowIdCounter.current += 1;
    return `row_${rowIdCounter.current}`;
  };

  // Constrói a estrutura inicial do formulário
  const sizeObj = useMemo(() => {
    const fieldDefs = Array.isArray(props.labelFieldDefs) ? props.labelFieldDefs : [];
    if (Array.isArray(props.initialEntries) && props.initialEntries.length > 0) {
      return props.initialEntries.map((entry) => ({
        rowId: createRowId(),
        itemId: "",
        size: entry.size || "",
        itemFields: normalizeLabelFieldValues(entry.itemFields || fieldDefs),
        boxFrom: Number(entry.boxFrom) || 0,
        boxTo: Number(entry.boxTo) || 0,
        unitsPerBox: Number(entry.unitsPerBox) || 0,
        remainBox: Number(entry.remainBox) || 0,
        remainUnits: Number(entry.remainUnits) || 0,
        totalPerSize: Number(entry.totalPerSize) || 0
      }));
    }
    const itemsToRender = labelItemsForRows.length > 0
      ? labelItemsForRows
      : [{ itemId: "default", fields: [] }];
    return itemsToRender.flatMap((item) =>
      props.data.map((size) => {
        const prefilledValues = normalizeLabelFieldValues(item.fields || fieldDefs);
        return {
          rowId: createRowId(),
          itemId: item.itemId || "",
          size,
          itemFields: fieldDefs.map((field) => ({
            fieldId: field.fieldId,
            name: field.name,
            value:
              prefilledValues.find((entry) => entry.fieldId === field.fieldId)?.value || ""
          })),
          boxFrom: 0,
          boxTo: 0,
          unitsPerBox: 0,
          remainBox: 0,
          remainUnits: 0,
          totalPerSize: 0
        };
      })
    );
  }, [props.data, props.initialEntries, props.labelFieldDefs, labelItemsForRows]);

  // Estado das linhas e do total agregado
  const [totalPerSize, setTotalPerSize] = useState(sizeObj);
  const [totalUnits, setTotalUnits] = useState(
    Number(props.initialTotalUnits) || 0
  );
  const [errors, setErrors] = useState({});

  // Reposiciona o estado quando muda a matriz ou entradas iniciais
  useEffect(() => {
    setTotalPerSize(sizeObj);
    setTotalUnits(Number(props.initialTotalUnits) || 0);
    setErrors({});
  }, [sizeObj, props.initialTotalUnits]);

  // Submete o formulário (delegado para o pai)
  const submitFormHandler = (event) => {
    event.preventDefault();
    const fieldErrors = validateAll(totalPerSize);
    if (Object.keys(fieldErrors).length > 0) {
      setErrors(fieldErrors);
      if (typeof props.onInvalid === "function") props.onInvalid(fieldErrors);
      return;
    }
    const hasInvalidRow = totalPerSize.some(
      (row) => !isRowValid(row, totalPerSize)
    );
    if (hasInvalidRow) {
      if (typeof props.onInvalid === "function") props.onInvalid();
      return;
    }
    if (typeof props.onSubmit === "function") {
      props.onSubmit({
        sizeMatrix: props.data,
        entries: totalPerSize.map((row) => ({
          size: row.size,
          itemFields: row.itemFields,
          boxFrom: row.boxFrom,
          boxTo: row.boxTo,
          unitsPerBox: row.unitsPerBox,
          remainBox: row.remainBox,
          remainUnits: row.remainUnits,
          totalPerSize: row.totalPerSize
        })),
        totalUnits
      });
    }
  };

  // Atualiza uma propriedade de uma linha específica
  const inputChangeHandler = (rowId, prefix, value, property) => {
    const numValue = parseNumber(value);
    const updatedBoxFromPerSize = totalPerSize.map((obj) => {
      if (obj.rowId !== rowId) return obj;
      const candidate = { ...obj, [property]: numValue };
      if (!isInputValid(prefix, candidate)) {
        return { ...candidate, totalPerSize: 0 };
      }
      return candidate;
    });
    setDataFromInputs(updatedBoxFromPerSize);
  };

  // Atualiza os campos de artigo (dropdowns) numa linha
  const itemFieldChangeHandler = (rowId, fieldId, value) => {
    const updated = totalPerSize.map((row) => {
      if (row.rowId !== rowId) return row;
      return {
        ...row,
        itemFields: row.itemFields.map((field) =>
          field.fieldId === fieldId ? { ...field, value } : field
        )
      };
    });
    setDataFromInputs(updated);
  };

  // Converte input para número (vazio => 0)
  const parseNumber = (value) => {
    const trimmed = value.trim();
    if (trimmed === "") return 0;
    const parsed = Number(trimmed);
    return Number.isNaN(parsed) ? 0 : parsed;
  };

  // Valida se o intervalo de caixas é consistente
  const isValidRange = (obj) => {
    return obj.boxFrom > 0 && obj.boxTo > 0 && obj.boxTo >= obj.boxFrom;
  };

  // Verifica sobreposição entre intervalos
  const rangesOverlap = (aFrom, aTo, bFrom, bTo) => {
    return aFrom <= bTo && bFrom <= aTo;
  };

  // Verifica se o intervalo atual colide com outros
  const isRangeOverlapping = (candidate, allRows = totalPerSize) => {
    if (!isValidRange(candidate)) return false;
    return allRows.some((obj) => {
      if (obj.rowId === candidate.rowId || !isValidRange(obj)) return false;
      return rangesOverlap(
        candidate.boxFrom,
        candidate.boxTo,
        obj.boxFrom,
        obj.boxTo
      );
    });
  };

  // Verifica se um número de caixa já está a ser usado noutro intervalo
  const isBoxNumberInUse = (value, candidate, allRows = totalPerSize) => {
    if (value <= 0) return false;
    if (isValidRange(candidate)) {
      if (value >= candidate.boxFrom && value <= candidate.boxTo) return true;
    }
    return allRows.some((obj) => {
      if (obj.rowId === candidate.rowId || !isValidRange(obj)) return false;
      return value >= obj.boxFrom && value <= obj.boxTo;
    });
  };

  // Validação por tipo de campo (usado ao editar)
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

  // Handler do campo "Caixa De"
  const boxFromChangeHandler = (rowId, value) => {
    inputChangeHandler(rowId, "box_from_input_", value, "boxFrom");
  };

  // Handler do campo "Caixa Até"
  const boxToChangeHandler = (rowId, value) => {
    inputChangeHandler(rowId, "box_to_input_", value, "boxTo");
  };

  // Handler do campo "Quantidade por caixa"
  const qtyPerBoxChangeHandler = (rowId, value) => {
    inputChangeHandler(rowId, "units_per_box_input_", value, "unitsPerBox");
  };

  // Handler do campo "Caixa de restos"
  const remainBoxChangeHandler = (rowId, value) => {
    inputChangeHandler(rowId, "remain_box_input_", value, "remainBox");
  };

  // Handler do campo "Quantidade de restos"
  const remainQtyChangeHandler = (rowId, value) => {
    inputChangeHandler(rowId, "remain_units_input_", value, "remainUnits");
  };

  // Valida a linha completa (consistência e sobreposições)
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

  // Gera mensagens de erro por campo
  const validateAll = (rows) => {
    const errors = {};
    rows.forEach((row) => {
      const key = row.rowId;
      const rowErrors = {};
      if (row.boxFrom > 0 || row.boxTo > 0) {
        if (!isValidRange(row)) {
          rowErrors.boxRange = "Intervalo inválido (Caixa De/Até).";
        }
      }
      if (isRangeOverlapping(row, rows)) {
        rowErrors.boxRange = "Intervalo sobreposto com outro tamanho.";
      }
      if (row.unitsPerBox <= 0 && isValidRange(row)) {
        rowErrors.unitsPerBox = "Quantidade por caixa obrigatória.";
      }
      if (row.remainUnits > 0 && row.remainBox <= 0) {
        rowErrors.remainUnits = "Preencha a Caixa de Restos.";
      }
      if (row.remainBox > 0 && isBoxNumberInUse(row.remainBox, row, rows)) {
        rowErrors.remainBox = "Caixa de Restos já está em uso.";
      }
      if (Object.keys(rowErrors).length > 0) {
        errors[key] = rowErrors;
      }
    });
    return errors;
  };

  const getFieldOptions = (fieldId) => {
    const values = [];
    labelItems.forEach((item) => {
      const value = item.fields.find((field) => field.fieldId === fieldId)?.value || "";
      if (value && !values.includes(value)) values.push(value);
    });
    return values;
  };

  // Recalcula totais por linha e total global
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
  };

  return (
    <Form className={`${styles["form-control"]}`} onSubmit={submitFormHandler}>
      <Card className={styles.tableCard}>
          <Table striped bordered hover variant="dark" className={styles.table}>
            <thead>
              <tr>
                {(props.labelFieldDefs || []).map((field) => (
                  <td key={`field_label_${field.fieldId}`}>{field.name}</td>
                ))}
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
                const rowErrors = errors[size.rowId] || {};
                return (
                <tr key={"tr_" + size.rowId}>
                  {(props.labelFieldDefs || []).map((field) => (
                    <td key={`${size.rowId}_${field.fieldId}`}>
                      <Form.Select
                        size="sm"
                        className={`${styles.compactInput}`}
                        value={
                          size.itemFields.find((rowField) => rowField.fieldId === field.fieldId)
                            ?.value || ""
                        }
                        onChange={(event) =>
                          itemFieldChangeHandler(size.rowId, field.fieldId, event.target.value)
                        }
                      >
                        <option value="">--</option>
                        {getFieldOptions(field.fieldId).map((optionValue) => (
                          <option
                            key={`${size.rowId}_${field.fieldId}_${optionValue}`}
                            value={optionValue}
                          >
                            {optionValue}
                          </option>
                        ))}
                      </Form.Select>
                    </td>
                  ))}
                  <td>
                    <label id={"size_" + size.size} key={"size_" + size.size}>
                      {size.size}
                    </label>
                  </td>
                  <td>
                    <input
                      type="number"
                      min="0"
                      onChange={(event) =>
                        boxFromChangeHandler(size.rowId, event.target.value)
                      }
                      className={`${styles.compactInput} ${inputClass}`}
                      value={size.boxFrom || ""}
                    />
                    {rowErrors.boxRange ? (
                      <div className={styles.errorText}>
                        {rowErrors.boxRange}
                      </div>
                    ) : null}
                  </td>
                  <td>
                    <input
                      type="number"
                      min="0"
                      onChange={(event) =>
                        boxToChangeHandler(size.rowId, event.target.value)
                      }
                      className={`${styles.compactInput} ${inputClass}`}
                      value={size.boxTo || ""}
                    />
                  </td>
                  <td>
                    <input
                      type="number"
                      min="0"
                      onChange={(event) =>
                        qtyPerBoxChangeHandler(size.rowId, event.target.value)
                      }
                      className={`${styles.compactInput} ${inputClass}`}
                      value={size.unitsPerBox || ""}
                    />
                    {rowErrors.unitsPerBox ? (
                      <div className={styles.errorText}>
                        {rowErrors.unitsPerBox}
                      </div>
                    ) : null}
                  </td>
                  <td>
                    <input
                      type="number"
                      min="0"
                      onChange={(event) =>
                        remainBoxChangeHandler(size.rowId, event.target.value)
                      }
                      className={`${styles.compactInput} ${inputClass}`}
                      value={size.remainBox || ""}
                    />
                    {rowErrors.remainBox ? (
                      <div className={styles.errorText}>
                        {rowErrors.remainBox}
                      </div>
                    ) : null}
                  </td>
                  <td>
                    <input
                      type="number"
                      min="0"
                      onChange={(event) =>
                        remainQtyChangeHandler(size.rowId, event.target.value)
                      }
                      className={`${styles.compactInput} ${inputClass}`}
                      value={size.remainUnits || ""}
                    />
                    {rowErrors.remainUnits ? (
                      <div className={styles.errorText}>
                        {rowErrors.remainUnits}
                      </div>
                    ) : null}
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
                <td colSpan={6 + (props.labelFieldDefs || []).length}>Total</td>
                <td>{totalUnits}</td>
              </tr>
            </tbody>
          </Table>
      </Card>
      <Button
        variant="primary"
        type={"submit"}
        disabled={props.isSubmitDisabled}
      >
        {props.submitLabel || "Gerar Packing"}
      </Button>
    </Form>
  );
};

export default PackingListForm;




