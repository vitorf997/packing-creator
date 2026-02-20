import express from "express";
import Client from "../models/Client.js";
import LabelTemplate from "../models/LabelTemplate.js";

const router = express.Router();

const normalizeLabelFields = (labelFields = []) => {
  const isMeaningfulName = (value) => {
    const normalized = String(value || "").trim();
    if (!normalized) return false;
    return !/^campo\s*\d+$/i.test(normalized);
  };

  if (Array.isArray(labelFields)) {
    const normalized = labelFields
      .map((item, index) => ({
        fieldId: String(item?.fieldId || `field_${index + 1}`).trim(),
        name: String(item?.name || "").trim()
      }))
      .filter((item) => isMeaningfulName(item.name))
      .slice(0, 12);

    const usedIds = new Set();
    return normalized
      .map((item, index) => ({
        fieldId:
          item.fieldId && !usedIds.has(item.fieldId)
            ? item.fieldId
            : `field_${index + 1}`,
        name: item.name
      }))
      .filter((item) => {
        if (usedIds.has(item.fieldId)) return false;
        usedIds.add(item.fieldId);
        return true;
      });
  }

  if (labelFields && typeof labelFields === "object") {
    return ["field1Name", "field2Name", "field3Name"]
      .map((key, index) => ({
        fieldId: `field_${index + 1}`,
        name: String(labelFields[key] || "").trim()
      }))
      .filter((item) => isMeaningfulName(item.name));
  }

  return [];
};

const validateTemplateForClient = async (labelTemplateId, clientId = null) => {
  if (!labelTemplateId) return null;
  const template = await LabelTemplate.findById(labelTemplateId).lean();
  if (!template) {
    return "Template de etiqueta inválido.";
  }
  if (template.active === false) {
    return "Template de etiqueta inativo.";
  }
  if (clientId && template.clientId && String(template.clientId) !== String(clientId)) {
    return "Template pertence a outro cliente.";
  }
  if (!clientId && template.clientId) {
    return "Na criação, só pode usar template global.";
  }
  return null;
};

// Lista clientes
router.get("/", async (req, res) => {
  try {
    const { q } = req.query;
    const query = {};
    if (q && String(q).trim().length > 0) {
      const regex = new RegExp(String(q).trim(), "i");
      query.$or = [{ name: regex }, { code: regex }, { contact: regex }];
    }
    const items = await Client.find(query)
      .populate("labelTemplateId", "name key layout isDefault active")
      .sort({ createdAt: -1 })
      .limit(200)
      .lean();
    return res.json(items);
  } catch (error) {
    return res.status(500).json({ error: "Failed to fetch clients" });
  }
});

// Obtém cliente por id
router.get("/:id", async (req, res) => {
  try {
    const populated = await Client.findById(req.params.id)
      .populate("labelTemplateId", "name key layout isDefault active")
      .lean();
    if (!populated) return res.status(404).json({ error: "Not found" });
    return res.json(populated);
  } catch (error) {
    return res.status(400).json({ error: "Invalid id" });
  }
});

// Cria cliente
router.post("/", async (req, res) => {
  try {
    const { name, code, contact, notes, labelTemplateId, labelFields } = req.body;
    if (!name || String(name).trim().length === 0) {
      return res.status(400).json({ error: "name is required" });
    }
    const templateError = await validateTemplateForClient(labelTemplateId, null);
    if (templateError) {
      return res.status(400).json({ error: templateError });
    }
    const created = await Client.create({
      name: String(name).trim(),
      code: String(code || "").trim(),
      contact: String(contact || "").trim(),
      notes: String(notes || "").trim(),
      labelFields: normalizeLabelFields(labelFields),
      labelTemplateId: labelTemplateId || null
    });
    return res.status(201).json(created);
  } catch (error) {
    return res.status(500).json({ error: "Failed to create client" });
  }
});

// Atualiza cliente
router.put("/:id", async (req, res) => {
  try {
    const { name, code, contact, notes, labelTemplateId, labelFields } = req.body;
    if (!name || String(name).trim().length === 0) {
      return res.status(400).json({ error: "name is required" });
    }
    const templateError = await validateTemplateForClient(labelTemplateId, req.params.id);
    if (templateError) {
      return res.status(400).json({ error: templateError });
    }
    const updated = await Client.findByIdAndUpdate(
      req.params.id,
      {
        name: String(name).trim(),
        code: String(code || "").trim(),
        contact: String(contact || "").trim(),
        notes: String(notes || "").trim(),
        labelFields: normalizeLabelFields(labelFields),
        labelTemplateId: labelTemplateId || null
      },
      { new: true }
    )
      .populate("labelTemplateId", "name key layout isDefault active")
      .lean();
    if (!updated) return res.status(404).json({ error: "Not found" });
    return res.json(updated);
  } catch (error) {
    return res.status(400).json({ error: "Invalid id" });
  }
});

// Remove cliente
router.delete("/:id", async (req, res) => {
  try {
    const deleted = await Client.findByIdAndDelete(req.params.id).lean();
    if (!deleted) return res.status(404).json({ error: "Not found" });
    return res.json({ ok: true });
  } catch (error) {
    return res.status(400).json({ error: "Invalid id" });
  }
});

export default router;
