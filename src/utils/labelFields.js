// Normaliza os campos de rótulo do cliente para formato de lista dinâmica
export const normalizeClientLabelFields = (input) => {
  const isMeaningfulName = (value) => {
    const normalized = String(value || "").trim();
    if (!normalized) return false;
    return !/^campo\s*\d+$/i.test(normalized);
  };

  if (Array.isArray(input)) {
    return input
      .map((item, index) => ({
        fieldId: String(item?.fieldId || `field_${index + 1}`).trim(),
        name: String(item?.name || "").trim()
      }))
      .filter((item) => isMeaningfulName(item.name));
  }

  if (input && typeof input === "object") {
    const legacy = [
      input.field1Name,
      input.field2Name,
      input.field3Name
    ]
      .map((name, index) => ({
        fieldId: `field_${index + 1}`,
        name: String(name || "").trim()
      }))
      .filter((item) => isMeaningfulName(item.name));
    if (legacy.length > 0) return legacy;
  }

  return [];
};

// Cria um novo campo de rótulo com identificador estável
export const createLabelField = (index = 0) => ({
  fieldId: `field_${Date.now()}_${index + 1}`,
  name: ""
});

// Normaliza valores dos campos no packing list
export const normalizeLabelFieldValues = (input) => {
  if (!Array.isArray(input)) return [];
  return input
    .map((item, index) => ({
      fieldId: String(item?.fieldId || `field_${index + 1}`).trim(),
      name: String(item?.name || "").trim(),
      value: String(item?.value || "").trim()
    }))
    .filter((item) => item.fieldId && item.name);
};

// Cria um item (bloco) de referência para seleção no packing
export const createLabelItem = (fieldDefs = [], index = 0) => ({
  itemId: `item_${Date.now()}_${index + 1}`,
  fields: fieldDefs.map((field) => ({
    fieldId: field.fieldId,
    name: field.name,
    value: ""
  }))
});

// Normaliza lista de itens de referência
export const normalizeLabelItems = (input, fieldDefs = []) => {
  if (!Array.isArray(input)) return [];
  return input
    .map((item, index) => {
      const baseById = new Map(
        normalizeLabelFieldValues(item?.fields).map((field) => [field.fieldId, field])
      );
      return {
        itemId: String(item?.itemId || `item_${index + 1}`).trim(),
        fields: fieldDefs.map((def) => ({
          fieldId: def.fieldId,
          name: def.name,
          value: baseById.get(def.fieldId)?.value || ""
        }))
      };
    })
    .filter((item) => item.itemId);
};
