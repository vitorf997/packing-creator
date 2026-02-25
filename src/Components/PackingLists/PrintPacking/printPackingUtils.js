import {
  normalizeClientLabelFields,
  normalizeLabelFieldValues
} from "../../../utils/labelFields";
import fermirLogo from "../../../assets/fermir_logo.jpg";

// Abre uma janela de impressão A4 para a packing list
export const openPrintPackingWindow = async (packingList) => {
  if (!packingList) return;

  const template = await resolveTemplate(packingList.clientId?._id);
  const layout = mergeLayout(template?.layout);
  const fieldDefs = normalizeClientLabelFields(packingList.clientId?.labelFields);
  const detailRows = buildDetailRows(packingList, fieldDefs);
  const summaryColumns = resolveSummaryColumns(layout, fieldDefs);
  const summary = buildSummary(detailRows, packingList, summaryColumns);
  const detailTotalQuantity = detailRows.reduce(
    (acc, row) => acc + (Number(row.quantity) || 0),
    0
  );
  const detailTotalBoxes = detailRows.reduce(
    (acc, row) => acc + (Number(row.packages) || 0),
    0
  );
  const maxBox = detailRows.reduce(
    (max, row) => Math.max(max, Number(row.maxBoxNumber) || 0),
    0
  );
  const totalBoxes = maxBox > 0 ? maxBox : detailTotalBoxes;
  const headerRows = Array.isArray(layout.headerFields) ? layout.headerFields : [];
  const language = normalizePackingLanguage(packingList.clientId?.language);
  const t = getPackingTranslations(language);
  const hasPoInHeader = headerRows.some(
    (row) => String(row?.source || "").trim().toLowerCase() === "po"
  );
  const headerValues = headerRows.map((row) => ({
    label: localizeBilingualLabel(row.label || "-", language),
    value: resolveSourceValue(row.source, packingList, fieldDefs)
  }));
  const leftHeaderRows = headerValues.filter((_, index) => index % 2 === 0);
  const rightHeaderRows = headerValues.filter((_, index) => index % 2 === 1);
  const today = new Date().toLocaleDateString(languageToLocale(language));

  const win = window.open("", "_blank");
  if (!win) return;

  const html = `<!doctype html>
<html>
  <head>
    <meta charset="utf-8" />
    <title>Packing List</title>
    <style>
      @page { size: A4 portrait; margin: 8mm; }
      * { box-sizing: border-box; }
      body { margin: 0; font-family: Arial, sans-serif; color: #111; font-size: 11px; }
      .sheet { width: 100%; }
      .headerTop { display: flex; justify-content: flex-end; margin-bottom: 6px; }
      .brandLogo {
        width: 180px;
        height: 48px;
        object-fit: contain;
        object-position: right center;
        display: block;
      }
      .docTitle {
        text-align: center;
        font-size: 15px;
        font-weight: 700;
        margin: 2px 0 10px;
        letter-spacing: 0.2px;
      }
      .meta {
        display: grid;
        grid-template-columns: 1fr 1fr;
        gap: 2px 34px;
        margin: 0 0 10px;
      }
      .metaRow {
        font-size: 11px;
        line-height: 1.35;
        margin-bottom: 2px;
        white-space: nowrap;
      }
      .metaRow b { font-weight: 700; }
      .underlined { text-decoration: underline; font-weight: 700; }
      table { width: 100%; border-collapse: collapse; table-layout: fixed; margin-bottom: 10px; }
      th, td { border: 1px solid #222; padding: 3px 4px; text-align: center; }
      .detailTable { border: 2px solid #111; }
      .detailTable th { background: #8dc63f; color: #fff; font-size: 11px; font-weight: 700; }
      .detailTable td { font-size: 11px; height: 22px; }
      .detailTable th:first-child,
      .detailTable td:first-child { width: 78px; }
      .detailTable th:nth-child(2),
      .detailTable td:nth-child(2) { width: 78px; }
      .detailTable th:nth-child(3),
      .detailTable td:nth-child(3) { width: 80px; }
      .detailTable th:last-child,
      .detailTable td:last-child { width: 110px; }
      .left { text-align: left; }
      .muted { color: #666; }
      .tableTotal td { font-weight: 700; background: #f4f7ee; border-top: 2px solid #111; }
      .summaryTitle {
        font-weight: 700;
        margin: 12px 0 0;
        background: #8dc63f;
        color: #fff;
        text-align: center;
        border: 2px solid #111;
        border-bottom: none;
        padding: 3px 8px;
        font-size: 11px;
        letter-spacing: 0.2px;
      }
      .summaryTable { border: 2px solid #111; }
      .summaryTable th, .summaryTable td { border-color: #111; }
      .summaryTable td { height: 24px; }
      .summaryTable .left { text-align: center; }
      .summaryTable th:first-child,
      .summaryTable td:first-child { width: 160px; }
      .summaryTable th:nth-child(2),
      .summaryTable td:nth-child(2) { width: 90px; }
      .summaryTable th:last-child,
      .summaryTable td:last-child { width: 70px; }
      .summaryTable .sizeSpacer {
        background: #fff;
      }
      .summaryHeadMain th {
        background: #8dc63f;
        color: #fff;
        font-weight: 700;
        border-width: 2px;
      }
      .summaryHeadSizes th { border-width: 2px; font-weight: 700; background: #fff; }
      .summaryTotal td { font-weight: 700; border-width: 2px; }
      .summaryTotal td:first-child {
        background: #8dc63f;
        color: #fff;
        text-align: right;
      }
      @media print {
        body { -webkit-print-color-adjust: exact; print-color-adjust: exact; }
      }
    </style>
  </head>
  <body>
    <div class="sheet">
      <div class="headerTop">
        ${
          fermirLogo
            ? `<img class="brandLogo" src="${escapeHtml(fermirLogo)}" alt="${escapeHtml(
                layout.companyName || "FERMIR"
              )}" />`
            : `<div>${escapeHtml(layout.companyName || "FERMIR")}</div>`
        }
      </div>
      <div class="docTitle">${escapeHtml(
        localizeBilingualLabel(layout.title, language) || t.packingListTitle
      )}</div>
      <div class="meta">
        <div>
          ${leftHeaderRows
            .map(
              (item) =>
                `<div class="metaRow"><b>${escapeHtml(item.label)}:</b> ${escapeHtml(item.value || "-")}</div>`
            )
            .join("")}
        </div>
        <div>
          ${
            !hasPoInHeader
              ? `<div class="metaRow"><b>${escapeHtml(t.po)}:</b> ${escapeHtml(
                  packingList.po || "-"
                )}</div>`
              : ""
          }
          ${rightHeaderRows
            .map(
              (item) =>
                `<div class="metaRow"><b>${escapeHtml(item.label)}:</b> ${escapeHtml(item.value || "-")}</div>`
            )
            .join("")}
          <div class="metaRow underlined">${escapeHtml(t.deliveryDateLabel)}: ${escapeHtml(
            today
          )}</div>
        </div>
      </div>

      <table class="detailTable">
        <thead>
          <tr>
            <th>${escapeHtml(t.sequence)}</th>
            <th>${escapeHtml(t.totalBoxes)}</th>
            <th>${escapeHtml(t.unitPerBox)}</th>
            ${fieldDefs.map((field) => `<th>${escapeHtml(field.name)}</th>`).join("")}
            <th>${escapeHtml(t.size)}</th>
            <th>${escapeHtml(t.quantity)}</th>
            <th>${escapeHtml(t.notes)}</th>
          </tr>
        </thead>
        <tbody>
          ${
            detailRows.length > 0
              ? detailRows
                  .map(
                    (row) => `<tr>
              <td>${escapeHtml(row.sequence)}</td>
              <td>${row.packages}</td>
              <td>${row.unitsPerPackage}</td>
              ${fieldDefs
                .map((field) => `<td class="left">${escapeHtml(row.fieldValues[field.fieldId] || "")}</td>`)
                .join("")}
              <td>${escapeHtml(row.size)}</td>
              <td>${row.quantity}</td>
              <td>${row.isRemainder ? escapeHtml(t.remainderBox) : ""}</td>
            </tr>`
                  )
                  .join("")
              : `<tr><td colspan="${7 + fieldDefs.length}" class="muted">${escapeHtml(
                  t.noDataToPrint
                )}</td></tr>`
          }
          <tr class="tableTotal">
            <td class="left">${escapeHtml(t.total)}</td>
            <td>${totalBoxes || 0}</td>
            <td></td>
            ${fieldDefs.map(() => "<td></td>").join("")}
            <td></td>
            <td>${detailTotalQuantity || 0}</td>
            <td></td>
          </tr>
        </tbody>
      </table>

      ${
        layout.showSummary
          ? `
      <div class="summaryTitle">${escapeHtml(t.summaryTableTitle)}</div>
      <table class="summaryTable">
        <thead>
          <tr class="summaryHeadMain">
            ${summary.columns
              .map((column) => `<th rowspan="2">${escapeHtml(column.label)}</th>`)
              .join("")}
            <th colspan="${summary.sizes.length || 1}">${escapeHtml(t.sizes)}</th>
            <th rowspan="2">${escapeHtml(t.total)}</th>
          </tr>
          <tr class="summaryHeadSizes">
            ${
              summary.sizes.length > 0
                ? summary.sizes.map((size) => `<th>${escapeHtml(size)}</th>`).join("")
                : "<th>-</th>"
            }
          </tr>
        </thead>
        <tbody>
          ${
            summary.rows.length > 0
              ? summary.rows
                  .map(
                    (row) => `<tr>
              ${summary.columns
                .map(
                  (column) =>
                    `<td class="left">${escapeHtml(row.groupValues[column.id] || "-")}</td>`
                )
                .join("")}
              ${
                summary.sizes.length > 0
                  ? summary.sizes.map((size) => `<td>${row.bySize[size] || 0}</td>`).join("")
                  : "<td>0</td>"
              }
              <td>${row.total || 0}</td>
            </tr>`
                  )
                  .join("")
              : `<tr><td colspan="${
                  summary.columns.length + summary.sizes.length + 1
                }" class="muted">${escapeHtml(t.noSummaryData)}</td></tr>`
          }
          <tr class="summaryTotal">
            <td colspan="${summary.columns.length}" class="left"><b>${escapeHtml(
              t.total
            )}</b></td>
            ${
              summary.sizes.length > 0
                ? summary.sizes
                    .map((size) => `<td><b>${summary.totalBySize[size] || 0}</b></td>`)
                    .join("")
                : "<td><b>0</b></td>"
            }
            <td><b>${summary.grandTotal || 0}</b></td>
          </tr>
        </tbody>
      </table>`
          : ""
      }
    </div>
    <script>window.print();</script>
  </body>
</html>`;

  win.document.open();
  win.document.write(html);
  win.document.close();
};

const buildDetailRows = (packingList, fieldDefs) => {
  const rows = [];
  (packingList.entries || []).forEach((entry) => {
    const size = String(entry.size || "").trim();
    if (!size) return;
    const fieldValues = normalizeLabelFieldValues(entry.itemFields).reduce((acc, item) => {
      acc[item.fieldId] = item.value || "";
      return acc;
    }, {});
    fieldDefs.forEach((field) => {
      if (!(field.fieldId in fieldValues)) fieldValues[field.fieldId] = "";
    });

    const from = Number(entry.boxFrom) || 0;
    const to = Number(entry.boxTo) || 0;
    const unitsPerBox = Number(entry.unitsPerBox) || 0;
    if (from > 0 && to >= from && unitsPerBox > 0) {
      const packages = to - from + 1;
      rows.push({
        sequence: `${from}-${to}`,
        packages,
        unitsPerPackage: unitsPerBox,
        size,
        quantity: packages * unitsPerBox,
        fieldValues,
        isRemainder: false,
        maxBoxNumber: to
      });
    }

    const remainBox = Number(entry.remainBox) || 0;
    const remainUnits = Number(entry.remainUnits) || 0;
    if (remainBox > 0 && remainUnits > 0) {
      rows.push({
        sequence: String(remainBox),
        packages: 1,
        unitsPerPackage: remainUnits,
        size,
        quantity: remainUnits,
        fieldValues,
        isRemainder: true,
        maxBoxNumber: remainBox
      });
    }
  });
  return rows;
};

const buildSummary = (rows, packingList, summaryColumns) => {
  const sizes = packingList.sizeMatrixId?.sizes || packingList.sizeMatrix || [];
  const grouped = new Map();

  rows.forEach((row) => {
    const groupValues = summaryColumns.reduce((acc, column) => {
      acc[column.id] = column.getValue(row) || "";
      return acc;
    }, {});
    const groupKey = summaryColumns.map((column) => groupValues[column.id] || "").join("|");
    const safeKey = groupKey || "__all__";
    const existing = grouped.get(safeKey) || {
      groupValues,
      bySize: {},
      total: 0
    };
    const qty = Number(row.quantity) || 0;
    existing.bySize[row.size] = (Number(existing.bySize[row.size]) || 0) + qty;
    existing.total += qty;
    grouped.set(safeKey, existing);
  });

  const rowsOut = Array.from(grouped.values()).sort((a, b) => {
    const keyA = summaryColumns
      .map((column) => String(a.groupValues[column.id] || ""))
      .join("|");
    const keyB = summaryColumns
      .map((column) => String(b.groupValues[column.id] || ""))
      .join("|");
    return keyA.localeCompare(keyB);
  });
  const totalBySize = sizes.reduce((acc, size) => {
    acc[size] = rowsOut.reduce(
      (sum, row) => sum + (Number(row.bySize[size]) || 0),
      0
    );
    return acc;
  }, {});
  const grandTotal = Object.values(totalBySize).reduce(
    (acc, value) => acc + (Number(value) || 0),
    0
  );
  return { columns: summaryColumns, sizes, rows: rowsOut, totalBySize, grandTotal };
};

const resolveSummaryColumns = (layout, fieldDefs) => {
  const selected = Array.isArray(layout.detailFieldColumnIds)
    ? layout.detailFieldColumnIds
    : [];
  const fromLayout = selected
    .filter((columnId) => String(columnId).startsWith("field:"))
    .map((columnId) => {
      const fieldId = String(columnId).slice(6);
      const field = fieldDefs.find((item) => item.fieldId === fieldId);
      if (!field) return null;
      return {
        id: fieldId,
        label: field.name,
        getValue: (row) => row.fieldValues[fieldId] || ""
      };
    })
    .filter(Boolean);

  if (fromLayout.length > 0) return fromLayout;
  return [
    {
      id: "__item",
      label: "Item",
      getValue: () => "Geral"
    }
  ];
};

const mergeLayout = (layout = {}) => ({
  title: "LISTA DE CONTEÚDO / PACKING LIST",
  detailFieldColumnIds: [],
  showSummary: true,
  ...layout
});

const resolveTemplate = async (clientId) => {
  try {
    const query = new URLSearchParams({
      active: "true",
      ...(clientId ? { clientId } : {})
    });
    const res = await fetch(`/api/packing-templates?${query.toString()}`);
    if (!res.ok) return null;
    const templates = await res.json();
    if (!Array.isArray(templates) || templates.length === 0) return null;
    const clientSpecific = clientId
      ? templates.find(
          (item) => String(item.clientId?._id || item.clientId || "") === String(clientId)
        )
      : null;
    return (
      clientSpecific ||
      templates.find((item) => item.isDefault) ||
      templates.find((item) => item.key === "default_packing_a4") ||
      templates[0] ||
      null
    );
  } catch (error) {
    return null;
  }
};

const resolveSourceValue = (source, packingList, fieldDefs) => {
  const normalized = String(source || "").trim();
  if (!normalized) return "";
  if (normalized === "clientName") return packingList.clientId?.name || "";
  if (normalized === "po") return packingList.po || "";
  if (normalized === "model") return packingList.model || "";
  if (normalized === "date") return new Date().toLocaleDateString();
  if (normalized.startsWith("field:")) {
    const fieldId = normalized.slice(6);
    const fromItems = (packingList.labelItems || [])
      .flatMap((item) => item?.fields || [])
      .find((field) => String(field?.fieldId || "") === fieldId);
    if (fromItems?.value) return fromItems.value;
    return fieldDefs.find((field) => field.fieldId === fieldId)?.name || "";
  }
  return "";
};

const normalizePackingLanguage = (value) => {
  const lang = String(value || "").trim().toLowerCase();
  if (["pt", "en", "es", "fr"].includes(lang)) return lang;
  return "pt";
};

const languageToLocale = (language) => {
  if (language === "en") return "en-US";
  if (language === "es") return "es-ES";
  if (language === "fr") return "fr-FR";
  return "pt-PT";
};

const getPackingTranslations = (language) => {
  const dict = {
    pt: {
      packingListTitle: "LISTA DE CONTEUDO",
      deliveryDateLabel: "Data de entrega",
      po: "PO",
      sequence: "Sequência",
      totalBoxes: "Nº bultos",
      unitPerBox: "Unid./bulto",
      size: "Tamanho",
      quantity: "Qtd",
      notes: "Obs.",
      remainderBox: "Caixa de restos",
      noDataToPrint: "Sem dados para imprimir.",
      summaryTableTitle: "TABELA RESUMO",
      sizes: "Tamanhos",
      total: "Total",
      noSummaryData: "Sem dados para resumo."
    },
    en: {
      packingListTitle: "PACKING LIST",
      deliveryDateLabel: "Delivery date",
      po: "PO",
      sequence: "Sequence",
      totalBoxes: "Total boxes",
      unitPerBox: "Unit per box",
      size: "Size",
      quantity: "Quantity",
      notes: "Notes",
      remainderBox: "Remainder box",
      noDataToPrint: "No data to print.",
      summaryTableTitle: "SUMMARY TABLE",
      sizes: "Sizes",
      total: "Total",
      noSummaryData: "No summary data."
    },
    es: {
      packingListTitle: "LISTA DE CONTENIDO",
      deliveryDateLabel: "Fecha de entrega",
      po: "PO",
      sequence: "Secuencia",
      totalBoxes: "Nº bultos",
      unitPerBox: "Unid./bulto",
      size: "Talla",
      quantity: "Cantidad",
      notes: "Obs.",
      remainderBox: "Caja de restos",
      noDataToPrint: "Sin datos para imprimir.",
      summaryTableTitle: "TABLA RESUMEN",
      sizes: "Tallas",
      total: "Total",
      noSummaryData: "Sin datos para resumen."
    },
    fr: {
      packingListTitle: "LISTE DE CONTENU",
      deliveryDateLabel: "Date de livraison",
      po: "PO",
      sequence: "Sequence",
      totalBoxes: "Nb colis",
      unitPerBox: "Unites/colis",
      size: "Taille",
      quantity: "Quantite",
      notes: "Obs.",
      remainderBox: "Boite de restes",
      noDataToPrint: "Aucune donnee a imprimer.",
      summaryTableTitle: "TABLEAU RECAPITULATIF",
      sizes: "Tailles",
      total: "Total",
      noSummaryData: "Aucune donnee de resume."
    }
  };

  return dict[normalizePackingLanguage(language)] || dict.pt;
};

const localizeBilingualLabel = (label, language) => {
  const text = String(label || "").trim();
  if (!text) return "";
  if (!text.includes("/")) return text;
  const parts = text
    .split("/")
    .map((item) => item.trim())
    .filter(Boolean);
  if (parts.length === 0) return text;
  if (parts.length === 1) return parts[0];
  if (language === "en") return parts[1] || parts[0];
  return parts[0];
};

const escapeHtml = (value) =>
  String(value)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
