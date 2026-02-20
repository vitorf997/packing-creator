import {
  normalizeClientLabelFields,
  normalizeLabelFieldValues,
  normalizeLabelItems
} from "../../../utils/labelFields";

// Gera rótulos por caixa e abre uma janela de impressão A6
export const openPrintLabelsWindow = async (packingList) => {
  const labels = buildBoxLabels(packingList);
  if (labels.length === 0) return;

  const win = window.open("", "_blank");
  if (!win) return;

  const totalBoxes = labels.reduce(
    (max, label) => Math.max(max, Number(label.box) || 0),
    0
  );
  const clientName = packingList.clientId?.name || "";
  const po = packingList.po || "";
  const model = packingList.model || "";
  const sizeColumns =
    packingList.sizeMatrixId?.sizes || packingList.sizeMatrix || [];

  const labelFields = normalizeClientLabelFields(packingList.clientId?.labelFields);
  const labelItems = normalizeLabelItems(packingList.labelItems, labelFields);
  const firstItemByFieldId = new Map(
    (labelItems[0]?.fields || []).map((field) => [field.fieldId, field.value || ""])
  );
  const template = await resolveTemplate(
    packingList.clientId?.labelTemplateId,
    packingList.clientId?._id
  );
  const layout = mergeLayout(template?.layout);
  const orientation = layout.orientation === "portrait" ? "portrait" : "landscape";
  const topLeftValue = getFieldValue(layout.topLeftField, {
    model,
    po,
    fieldValueById: firstItemByFieldId,
    fallback:
      labelItems[0]?.fields?.find((item) => item.fieldId === labelFields[0]?.fieldId)?.value ||
      ""
  });
  const topRightValue = getFieldValue(layout.topRightField, {
    model,
    po,
    fieldValueById: firstItemByFieldId,
    fallback:
      labelItems[0]?.fields?.find((item) => item.fieldId === labelFields[1]?.fieldId)?.value ||
      ""
  });
  const emptyRows = Math.max(0, Math.min(8, Number(layout.emptyRows) || 4));
  const brandName = layout.brandName || "FERMIR";
  const brandBgColor = layout.brandBgColor || "#8dc63f";
  const brandTextColor = layout.brandTextColor || "#ffffff";
  const showRemainderLabel = Boolean(layout.showRemainderLabel);

  const html = `<!doctype html>
<html>
  <head>
    <meta charset="utf-8" />
    <title>Rotulos A6</title>
    <style>
      @page { size: A6 ${orientation}; margin: 4mm; }
      * { box-sizing: border-box; }
      html, body { margin: 0; padding: 0; }
      body {
        font-family: "Segoe UI", Arial, sans-serif;
        color: #0e1116;
        -webkit-print-color-adjust: exact;
        print-color-adjust: exact;
      }
      .page {
        width: 140mm;
        height: 97mm;
        display: grid;
        grid-template-rows: auto auto 1fr auto auto;
        gap: 3mm;
        page-break-after: always;
      }
      .topRow { display: grid; grid-template-columns: 1fr 1fr; gap: 5mm; }
      .topBox {
        border: 1px solid #111;
        font-size: 12px;
        height: 9mm;
        display: flex;
        align-items: center;
        justify-content: center;
        font-weight: 600;
      }
      .brandRow { display: grid; grid-template-columns: 1.4fr 1fr; gap: 5mm; }
      .brandBox {
        border: 1px solid #111;
        background: ${escapeHtml(brandBgColor)};
        color: ${escapeHtml(brandTextColor)};
        font-size: 22px;
        letter-spacing: 2px;
        text-align: center;
        height: 13mm;
        display: flex;
        align-items: center;
        justify-content: center;
        font-weight: 700;
      }
      .clientBox {
        border: 1px solid #111;
        font-size: 14px;
        font-weight: 700;
        text-align: center;
        height: 13mm;
        display: flex;
        align-items: center;
        justify-content: center;
      }
      .gridWrap { display: flex; align-items: stretch; }
      .grid { width: 100%; border-collapse: collapse; table-layout: fixed; }
      .grid th, .grid td {
        border: 1px solid #111;
        padding: 0 2px;
        text-align: center;
        font-size: 10px;
        height: 6mm;
      }
      .grid th { font-weight: 700; }
      .highlight { font-weight: 700; color: #d0021b; font-size: 14px; }
      .footerBox {
        border: 1px solid #111;
        text-align: center;
        font-size: 46px;
        line-height: 1;
        font-weight: 700;
        height: 13mm;
        display: flex;
        align-items: center;
        justify-content: center;
      }
      .muted { color: #666; font-size: 10px; text-align: center; }
      @media screen {
        body { padding: 8px; background: #f4f4f4; }
        .page { margin: 0 auto 12px; background: #fff; padding: 4mm; }
      }
    </style>
  </head>
  <body>
    ${labels
      .map((label) => {
        return `
          <div class="page">
            <div class="topRow">
              <div class="topBox">${escapeHtml(topLeftValue)}</div>
              <div class="topBox">${escapeHtml(topRightValue)}</div>
            </div>
            <div class="brandRow">
              <div class="brandBox">${escapeHtml(brandName)}</div>
              <div class="clientBox">${escapeHtml(clientName)}</div>
            </div>
            <div class="gridWrap">
              <table class="grid">
                <thead>
                  <tr>
                    ${labelFields
                      .map((field) => `<th>${escapeHtml(field.name)}</th>`)
                      .join("")}
                    ${sizeColumns.map((s) => `<th>${escapeHtml(s)}</th>`).join("")}
                  </tr>
                </thead>
                <tbody>
                  ${label.rows
                    .map(
                      (row) => `<tr>
                    ${labelFields
                      .map((field) => `<td>${escapeHtml(row.fieldValues?.[field.fieldId] || "")}</td>`)
                      .join("")}
                    ${sizeColumns
                      .map((s) => {
                        const qty = Number(row.quantitiesBySize?.[s]) || 0;
                        return qty > 0
                          ? `<td class="highlight">${qty}</td>`
                          : `<td></td>`;
                      })
                      .join("")}
                  </tr>`
                    )
                    .join("")}
                  ${Array.from({ length: emptyRows })
                    .map(
                      () =>
                        `<tr>${labelFields
                          .map(() => "<td></td>")
                          .join("")}${sizeColumns
                          .map(() => "<td></td>")
                          .join("")}</tr>`
                    )
                    .join("")}
                </tbody>
              </table>
            </div>
            <div class="footerBox">${label.box}/${totalBoxes}</div>
            ${
              showRemainderLabel && label.isRemainder
                ? `<div class="muted">Caixa de restos</div>`
                : ""
            }
          </div>
        `;
      })
      .join("")}
  </body>
</html>`;

  win.document.open();
  win.document.write(html);
  win.document.close();
  win.focus();
  win.print();
};

const resolveTemplate = async (clientTemplate, clientId) => {
  if (clientTemplate && typeof clientTemplate === "object" && clientTemplate.layout) {
    return clientTemplate;
  }
  try {
    const query = new URLSearchParams({
      active: "true",
      ...(clientId ? { clientId } : {})
    });
    const res = await fetch(`/api/label-templates?${query.toString()}`);
    if (!res.ok) return null;
    const templates = await res.json();
    if (!Array.isArray(templates)) return null;
    const clientSpecific = clientId
      ? templates.find(
          (item) =>
            String(item.clientId?._id || item.clientId || "") === String(clientId)
        )
      : null;
    return (
      clientSpecific ||
      templates.find((item) => item.isDefault) ||
      templates.find((item) => item.key === "fermir_classic_a6") ||
      templates[0] ||
      null
    );
  } catch (error) {
    return null;
  }
};

const mergeLayout = (layout = {}) => {
  return {
    orientation: "landscape",
    brandName: "FERMIR",
    brandBgColor: "#8dc63f",
    brandTextColor: "#ffffff",
    topLeftField: "model",
    topRightField: "po",
    emptyRows: 4,
    showRemainderLabel: true,
    ...layout
  };
};

const getFieldValue = (field, values) => {
  if (String(field || "").startsWith("field:")) {
    const fieldId = String(field).slice(6);
    return values.fieldValueById?.get(fieldId) || "";
  }
  if (field === "po") return values.po;
  if (field === "model") return values.model;
  return values.fallback || "";
};

const buildBoxLabels = (packingList) => {
  const boxMap = new Map();
  const entries = packingList.entries || [];
  const ensureBox = (box) => {
    const boxNumber = Number(box) || 0;
    if (boxNumber <= 0) return null;
    const existing = boxMap.get(boxNumber);
    if (existing) return existing;
    const created = {
      box: boxNumber,
      rowsByKey: new Map(),
      isRemainder: false
    };
    boxMap.set(boxNumber, created);
    return created;
  };

  entries.forEach((row) => {
    const sizeKey = String(row.size || "").trim();
    const fields = normalizeLabelFieldValues(row.itemFields);
    const rowKey = fields
      .map((field) => `${field.fieldId}:${field.value}`)
      .sort()
      .join("|");
    const fieldValues = fields.reduce((acc, field) => {
      acc[field.fieldId] = field.value || "";
      return acc;
    }, {});
    if (!sizeKey) return;
    const from = Number(row.boxFrom) || 0;
    const to = Number(row.boxTo) || 0;
    const unitsPerBox = Number(row.unitsPerBox) || 0;
    if (from > 0 && to >= from && unitsPerBox > 0) {
      for (let box = from; box <= to; box += 1) {
        const label = ensureBox(box);
        if (!label) continue;
        const rowLabel = label.rowsByKey.get(rowKey) || {
          fieldValues,
          quantitiesBySize: {}
        };
        rowLabel.quantitiesBySize[sizeKey] =
          (Number(rowLabel.quantitiesBySize[sizeKey]) || 0) + unitsPerBox;
        label.rowsByKey.set(rowKey, rowLabel);
      }
    }
    const remainBox = Number(row.remainBox) || 0;
    const remainUnits = Number(row.remainUnits) || 0;
    if (remainBox > 0 && remainUnits > 0) {
      const label = ensureBox(remainBox);
      if (!label) return;
      const rowLabel = label.rowsByKey.get(rowKey) || {
        fieldValues,
        quantitiesBySize: {}
      };
      rowLabel.quantitiesBySize[sizeKey] =
        (Number(rowLabel.quantitiesBySize[sizeKey]) || 0) + remainUnits;
      label.rowsByKey.set(rowKey, rowLabel);
      label.isRemainder = true;
    }
  });

  return Array.from(boxMap.values())
    .map((item) => ({
      ...item,
      rows: Array.from(item.rowsByKey.values())
    }))
    .sort((a, b) => a.box - b.box);
};

const escapeHtml = (value) => {
  return String(value)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
};
