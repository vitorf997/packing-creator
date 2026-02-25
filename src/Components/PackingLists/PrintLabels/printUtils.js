import {
  normalizeClientLabelFields,
  normalizeLabelFieldValues,
  normalizeLabelItems
} from "../../../utils/labelFields";

// Gera rótulos por caixa e abre uma janela de preview/impressão A6 paginada
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

  const firstBox = Number(labels[0]?.box) || 1;
  const html = `<!doctype html>
<html>
  <head>
    <meta charset="utf-8" />
    <title>Preview Rótulos A6</title>
    <style id="pageStyle">
      @page { size: A6 ${orientation}; margin: 4mm; }
    </style>
    <style>
      :root {
        --page-width: 140mm;
        --page-height: 97mm;
      }
      * { box-sizing: border-box; }
      html, body { margin: 0; padding: 0; }
      body {
        font-family: "Segoe UI", Arial, sans-serif;
        color: #0e1116;
        -webkit-print-color-adjust: exact;
        print-color-adjust: exact;
      }
      .toolbar {
        position: sticky;
        top: 0;
        z-index: 5;
        display: flex;
        align-items: center;
        gap: 8px;
        padding: 10px 12px;
        background: #ffffff;
        border-bottom: 1px solid #d9d9d9;
        flex-wrap: wrap;
      }
      .toolbar input {
        width: 90px;
        padding: 6px 8px;
        border: 1px solid #c8c8c8;
        border-radius: 4px;
      }
      .toolbar button {
        padding: 6px 10px;
        border: 1px solid #c8c8c8;
        border-radius: 4px;
        cursor: pointer;
        background: #f8f8f8;
      }
      .toolbar button.primary {
        background: #0d6efd;
        border-color: #0d6efd;
        color: #fff;
      }
      .toolbar .meta {
        margin-left: auto;
        font-size: 13px;
        color: #445;
      }
      .toolbar .formatBlock {
        display: inline-flex;
        align-items: center;
        gap: 8px;
        margin-left: 10px;
      }
      .pages {
        padding: 8px;
        background: #f4f4f4;
      }
      .page {
        width: var(--page-width);
        height: var(--page-height);
        display: grid;
        grid-template-rows: auto auto auto 1fr auto auto;
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
      .poRow {
        border: 1px solid #111;
        min-height: 7mm;
        padding: 1.5mm 2.5mm;
        font-size: 12px;
        display: flex;
        align-items: center;
        gap: 6px;
      }
      .poRow b { font-weight: 700; }
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
        .page { margin: 0 auto 12px; background: #fff; padding: 4mm; }
      }
      @media print {
        .toolbar { display: none !important; }
        .pages { padding: 0; background: #fff; }
      }
      body.mode-a4 {
        --page-width: 287mm;
        --page-height: 200mm;
      }
    </style>
  </head>
  <body>
    <div class="toolbar">
      <strong>Preview A6</strong>
      <span>De</span>
      <input id="boxFrom" type="number" min="${firstBox}" max="${totalBoxes}" value="${firstBox}" />
      <span>Até</span>
      <input id="boxTo" type="number" min="${firstBox}" max="${totalBoxes}" value="${totalBoxes}" />
      <button onclick="applyRange()">Aplicar intervalo</button>
      <button onclick="resetRange()">Mostrar tudo</button>
      <div class="formatBlock">
        <strong>Preview:</strong>
        <label><input type="radio" name="format" value="A6" checked onchange="setFormat(this.value)" /> A6</label>
        <label><input type="radio" name="format" value="A4" onchange="setFormat(this.value)" /> A4</label>
      </div>
      <button class="primary" onclick="window.print()">Imprimir</button>
      <span id="meta" class="meta"></span>
    </div>
    <div class="pages">
      ${labels
      .map((label) => {
        return `
          <div class="page" data-box="${label.box}">
            <div class="topRow">
              <div class="topBox">${escapeHtml(topLeftValue)}</div>
              <div class="topBox">${escapeHtml(topRightValue)}</div>
            </div>
            <div class="brandRow">
              <div class="brandBox">${escapeHtml(brandName)}</div>
              <div class="clientBox">${escapeHtml(clientName)}</div>
            </div>
            <div class="poRow"><b>PO:</b> <span>${escapeHtml(po || "-")}</span></div>
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
    </div>
    <script>
      const minBox = ${firstBox};
      const maxBox = ${totalBoxes};
      const pages = Array.from(document.querySelectorAll(".page"));
      const inputFrom = document.getElementById("boxFrom");
      const inputTo = document.getElementById("boxTo");
      const meta = document.getElementById("meta");
      const pageStyle = document.getElementById("pageStyle");

      const updateMeta = () => {
        const visible = pages.filter((page) => page.style.display !== "none").length;
        meta.textContent = "Caixas visíveis: " + visible + " de " + pages.length;
      };

      window.applyRange = () => {
        let from = Number(inputFrom.value);
        let to = Number(inputTo.value);
        if (!Number.isFinite(from)) from = minBox;
        if (!Number.isFinite(to)) to = maxBox;
        from = Math.max(minBox, Math.min(maxBox, Math.trunc(from)));
        to = Math.max(minBox, Math.min(maxBox, Math.trunc(to)));
        if (from > to) {
          const tmp = from;
          from = to;
          to = tmp;
        }
        inputFrom.value = from;
        inputTo.value = to;
        pages.forEach((page) => {
          const box = Number(page.dataset.box) || 0;
          page.style.display = box >= from && box <= to ? "grid" : "none";
        });
        updateMeta();
      };

      window.resetRange = () => {
        inputFrom.value = minBox;
        inputTo.value = maxBox;
        pages.forEach((page) => {
          page.style.display = "grid";
        });
        updateMeta();
      };

      window.setFormat = (format) => {
        if (format === "A4") {
          document.body.classList.add("mode-a4");
          pageStyle.textContent = "@page { size: A4 ${orientation}; margin: 5mm; }";
          return;
        }
        document.body.classList.remove("mode-a4");
        pageStyle.textContent = "@page { size: A6 ${orientation}; margin: 4mm; }";
      };

      updateMeta();
    </script>
  </body>
</html>`;

  win.document.open();
  win.document.write(html);
  win.document.close();
  win.focus();
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
