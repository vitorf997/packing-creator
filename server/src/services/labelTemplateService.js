import LabelTemplate from "../models/LabelTemplate.js";

const BASE_TEMPLATES = [
  {
    name: "Default A6 Landscape",
    key: "default_a6_landscape",
    isDefault: true,
    active: true,
    clientId: null,
    type: "A6_LANDSCAPE",
    layout: {
      orientation: "landscape",
      brandName: "PACKING",
      brandBgColor: "#0f62fe",
      brandTextColor: "#ffffff",
      referenceField: "model",
      colourField: "po",
      topLeftField: "model",
      topRightField: "po",
      emptyRows: 4,
      showRemainderLabel: true
    }
  },
  {
    name: "FERMIR Classic A6",
    key: "fermir_classic_a6",
    isDefault: false,
    active: true,
    clientId: null,
    type: "A6_LANDSCAPE",
    layout: {
      orientation: "landscape",
      brandName: "FERMIR",
      brandBgColor: "#8dc63f",
      brandTextColor: "#ffffff",
      referenceField: "model",
      colourField: "po",
      topLeftField: "model",
      topRightField: "po",
      emptyRows: 4,
      showRemainderLabel: true
    }
  }
];

// Garante que os templates base existem para uso imediato na app
export const ensureBaseLabelTemplates = async () => {
  for (const template of BASE_TEMPLATES) {
    await LabelTemplate.findOneAndUpdate(
      { key: template.key },
      { $setOnInsert: template },
      { upsert: true, new: false }
    );
  }
};
