import express from "express";
import PackingList from "../models/PackingList.js";

const router = express.Router();

const normalizeLabelFieldValues = (labelFieldValues = []) => {
  if (!Array.isArray(labelFieldValues)) return [];
  const normalized = labelFieldValues
    .map((item, index) => ({
      fieldId: String(item?.fieldId || `field_${index + 1}`).trim(),
      name: String(item?.name || "").trim(),
      value: String(item?.value || "").trim()
    }))
    .filter((item) => item.fieldId && item.name)
    .slice(0, 12);

  const ids = new Set();
  return normalized.filter((item) => {
    if (ids.has(item.fieldId)) return false;
    ids.add(item.fieldId);
    return true;
  });
};

const normalizeLabelItems = (labelItems = []) => {
  if (!Array.isArray(labelItems)) return [];
  return labelItems
    .map((item, index) => ({
      itemId: String(item?.itemId || `item_${index + 1}`).trim(),
      fields: normalizeLabelFieldValues(item?.fields)
    }))
    .filter((item) => item.itemId);
};

const normalizeEntryItemFields = (entries = []) => {
  if (!Array.isArray(entries)) return [];
  return entries.map((entry) => ({
    ...entry,
    itemFields: normalizeLabelFieldValues(entry?.itemFields)
  }));
};

// Lista as packing lists (limite 100)
router.get("/", async (req, res) => {
  try {
    const { q, clientId, sizeMatrixId } = req.query;
    const query = {};
    if (clientId) query.clientId = clientId;
    if (sizeMatrixId) query.sizeMatrixId = sizeMatrixId;
    let items = await PackingList.find(query)
      .populate("sizeMatrixId", "name sizes")
      .populate({
        path: "clientId",
        select: "name code contact labelFields labelTemplateId",
        populate: {
          path: "labelTemplateId",
          select: "name key layout isDefault active"
        }
      })
      .sort({ createdAt: -1 })
      .limit(100)
      .lean();
    if (q && String(q).trim().length > 0) {
      const regex = new RegExp(String(q).trim(), "i");
      items = items.filter((item) => {
        return (
          regex.test(item.po || "") ||
          regex.test(item.model || "") ||
          regex.test(item.notes || "") ||
          regex.test(item.clientId?.name || "") ||
          regex.test(item.sizeMatrixId?.name || "")
        );
      });
    }
    return res.json(items);
  } catch (error) {
    return res.status(500).json({ error: "Failed to fetch packing lists" });
  }
});

// Obtém uma packing list por id
router.get("/:id", async (req, res) => {
  try {
    const item = await PackingList.findById(req.params.id)
      .populate("sizeMatrixId", "name sizes")
      .populate({
        path: "clientId",
        select: "name code contact labelFields labelTemplateId",
        populate: {
          path: "labelTemplateId",
          select: "name key layout isDefault active"
        }
      })
      .lean();
    if (!item) return res.status(404).json({ error: "Not found" });
    return res.json(item);
  } catch (error) {
    return res.status(400).json({ error: "Invalid id" });
  }
});

// Cria uma nova packing list
router.post("/", async (req, res) => {
  try {
    const {
      po,
      model,
      clientId,
      sizeMatrixId,
      sizeMatrix,
      labelItems,
      entries,
      totalUnits,
      notes
    } = req.body;
    if (!clientId) {
      return res.status(400).json({ error: "clientId is required" });
    }
    if (!sizeMatrixId) {
      return res.status(400).json({ error: "sizeMatrixId is required" });
    }
    if (!Array.isArray(sizeMatrix) || sizeMatrix.length === 0) {
      return res.status(400).json({ error: "sizeMatrix is required" });
    }
    if (!Array.isArray(entries)) {
      return res.status(400).json({ error: "entries must be an array" });
    }
    const created = await PackingList.create({
      po: String(po || "").trim(),
      model: String(model || "").trim(),
      clientId,
      sizeMatrixId,
      sizeMatrix,
      labelItems: normalizeLabelItems(labelItems),
      entries: normalizeEntryItemFields(entries),
      totalUnits: Number(totalUnits) || 0,
      notes: typeof notes === "string" ? notes : ""
    });
    return res.status(201).json(created);
  } catch (error) {
    return res.status(500).json({ error: "Failed to create packing list" });
  }
});

// Atualiza uma packing list existente
router.put("/:id", async (req, res) => {
  try {
    const {
      po,
      model,
      clientId,
      sizeMatrixId,
      sizeMatrix,
      labelItems,
      entries,
      totalUnits,
      notes
    } = req.body;
    if (!clientId) {
      return res.status(400).json({ error: "clientId is required" });
    }
    if (!sizeMatrixId) {
      return res.status(400).json({ error: "sizeMatrixId is required" });
    }
    if (!Array.isArray(sizeMatrix) || sizeMatrix.length === 0) {
      return res.status(400).json({ error: "sizeMatrix is required" });
    }
    if (!Array.isArray(entries)) {
      return res.status(400).json({ error: "entries must be an array" });
    }
    const updated = await PackingList.findByIdAndUpdate(
      req.params.id,
      {
        po: String(po || "").trim(),
        model: String(model || "").trim(),
        clientId,
        sizeMatrixId,
        sizeMatrix,
        labelItems: normalizeLabelItems(labelItems),
        entries: normalizeEntryItemFields(entries),
        totalUnits: Number(totalUnits) || 0,
        notes: typeof notes === "string" ? notes : ""
      },
      { new: true }
    ).lean();
    if (!updated) return res.status(404).json({ error: "Not found" });
    return res.json(updated);
  } catch (error) {
    return res.status(400).json({ error: "Invalid id" });
  }
});

// Remove uma packing list por id
router.delete("/:id", async (req, res) => {
  try {
    const deleted = await PackingList.findByIdAndDelete(req.params.id).lean();
    if (!deleted) return res.status(404).json({ error: "Not found" });
    return res.json({ ok: true });
  } catch (error) {
    return res.status(400).json({ error: "Invalid id" });
  }
});

export default router;
