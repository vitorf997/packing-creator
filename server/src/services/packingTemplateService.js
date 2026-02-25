import PackingTemplate from "../models/PackingTemplate.js";

const BASE_TEMPLATES = [
  {
    name: "Default Packing A4",
    key: "default_packing_a4",
    isDefault: true,
    active: true,
    clientId: null,
    type: "A4_PORTRAIT",
    layout: {
      orientation: "portrait",
      companyName: "FERMIR",
      title: "LISTA DE CONTEÚDO / PACKING LIST",
      topLeftField: "po",
      topRightField: "model",
      headerFields: [
        { label: "Cliente / Customer", source: "clientName" },
        { label: "PO", source: "po" },
        { label: "Modelo", source: "model" }
      ],
      detailFieldColumnIds: [],
      emptyRows: 10,
      showSummary: true
    }
  }
];

// Garante que os templates base de packing existem
export const ensureBasePackingTemplates = async () => {
  for (const template of BASE_TEMPLATES) {
    await PackingTemplate.findOneAndUpdate(
      { key: template.key },
      { $setOnInsert: template },
      { upsert: true, new: false }
    );
  }
};
