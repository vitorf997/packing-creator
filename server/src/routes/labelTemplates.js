import express from "express";
import LabelTemplate from "../models/LabelTemplate.js";
import Client from "../models/Client.js";

const router = express.Router();

const normalizeLayout = (layout = {}) => {
  const safeField = (value, fallback) => {
    const normalized = String(value || "").trim();
    return normalized.length > 0 ? normalized : fallback;
  };
  return {
    orientation: layout.orientation === "portrait" ? "portrait" : "landscape",
    brandName: String(layout.brandName || "FERMIR").trim(),
    brandBgColor: String(layout.brandBgColor || "#8dc63f").trim(),
    brandTextColor: String(layout.brandTextColor || "#ffffff").trim(),
    topLeftField: safeField(layout.topLeftField, "model"),
    topRightField: safeField(layout.topRightField, "po"),
    emptyRows: Math.max(0, Math.min(8, Number(layout.emptyRows) || 4)),
    showRemainderLabel: Boolean(layout.showRemainderLabel)
  };
};

// Lista templates de etiqueta
router.get("/", async (req, res) => {
  try {
    const { q, clientId, active } = req.query;
    const query = {};
    if (clientId) query.$or = [{ clientId }, { clientId: null }];
    if (active === "true") query.active = true;
    if (active === "false") query.active = false;
    if (q && String(q).trim()) {
      const regex = new RegExp(String(q).trim(), "i");
      query.$and = [...(query.$and || []), { $or: [{ name: regex }, { key: regex }] }];
    }

    const items = await LabelTemplate.find(query)
      .populate("clientId", "name code")
      .sort({ isDefault: -1, createdAt: -1 })
      .limit(300)
      .lean();
    return res.json(items);
  } catch (error) {
    return res.status(500).json({ error: "Failed to fetch label templates" });
  }
});

// Obtém template por id
router.get("/:id", async (req, res) => {
  try {
    const item = await LabelTemplate.findById(req.params.id)
      .populate("clientId", "name code")
      .lean();
    if (!item) return res.status(404).json({ error: "Not found" });
    return res.json(item);
  } catch (error) {
    return res.status(400).json({ error: "Invalid id" });
  }
});

// Cria template
router.post("/", async (req, res) => {
  try {
    const { name, key, type, active, clientId, isDefault, layout } = req.body;
    const isGlobalDefault = Boolean(isDefault);
    const normalizedClientId = isGlobalDefault ? null : clientId || null;
    if (!name || !String(name).trim()) {
      return res.status(400).json({ error: "name is required" });
    }
    if (!key || !String(key).trim()) {
      return res.status(400).json({ error: "key is required" });
    }
    if (!isGlobalDefault && !normalizedClientId) {
      return res
        .status(400)
        .json({ error: "clientId is required when template is not default" });
    }
    if (normalizedClientId) {
      const clientExists = await Client.exists({ _id: normalizedClientId });
      if (!clientExists) {
        return res.status(400).json({ error: "clientId not found" });
      }
    }
    const created = await LabelTemplate.create({
      name: String(name).trim(),
      key: String(key).trim().toLowerCase(),
      type: String(type || "A6_LANDSCAPE").trim(),
      active: active !== false,
      clientId: normalizedClientId,
      isDefault: isGlobalDefault,
      layout: normalizeLayout(layout)
    });
    if (created.isDefault) {
      await LabelTemplate.updateMany(
        { _id: { $ne: created._id } },
        { $set: { isDefault: false } }
      );
    }
    return res.status(201).json(created);
  } catch (error) {
    if (error?.code === 11000) {
      return res.status(409).json({ error: "key already exists" });
    }
    return res.status(500).json({ error: "Failed to create label template" });
  }
});

// Atualiza template
router.put("/:id", async (req, res) => {
  try {
    const { name, key, type, active, clientId, isDefault, layout } = req.body;
    const isGlobalDefault = Boolean(isDefault);
    const normalizedClientId = isGlobalDefault ? null : clientId || null;
    if (!name || !String(name).trim()) {
      return res.status(400).json({ error: "name is required" });
    }
    if (!key || !String(key).trim()) {
      return res.status(400).json({ error: "key is required" });
    }
    if (!isGlobalDefault && !normalizedClientId) {
      return res
        .status(400)
        .json({ error: "clientId is required when template is not default" });
    }
    if (normalizedClientId) {
      const clientExists = await Client.exists({ _id: normalizedClientId });
      if (!clientExists) {
        return res.status(400).json({ error: "clientId not found" });
      }
    }
    const updated = await LabelTemplate.findByIdAndUpdate(
      req.params.id,
      {
        name: String(name).trim(),
        key: String(key).trim().toLowerCase(),
        type: String(type || "A6_LANDSCAPE").trim(),
        active: active !== false,
        clientId: normalizedClientId,
        isDefault: isGlobalDefault,
        layout: normalizeLayout(layout)
      },
      { new: true }
    ).lean();
    if (!updated) return res.status(404).json({ error: "Not found" });
    if (updated.isDefault) {
      await LabelTemplate.updateMany(
        { _id: { $ne: updated._id } },
        { $set: { isDefault: false } }
      );
    }
    return res.json(updated);
  } catch (error) {
    if (error?.code === 11000) {
      return res.status(409).json({ error: "key already exists" });
    }
    return res.status(400).json({ error: "Invalid data" });
  }
});

// Remove template
router.delete("/:id", async (req, res) => {
  try {
    const deleted = await LabelTemplate.findByIdAndDelete(req.params.id).lean();
    if (!deleted) return res.status(404).json({ error: "Not found" });
    return res.json({ ok: true });
  } catch (error) {
    return res.status(400).json({ error: "Invalid id" });
  }
});

export default router;
