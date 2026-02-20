import express from "express";
import SizeMatrix from "../models/SizeMatrix.js";

const router = express.Router();

// Lista matrizes de tamanhos
router.get("/", async (req, res) => {
  try {
    const { q } = req.query;
    const query = {};
    if (q && String(q).trim().length > 0) {
      const regex = new RegExp(String(q).trim(), "i");
      query.$or = [{ name: regex }, { sizes: regex }];
    }
    const items = await SizeMatrix.find(query)
      .sort({ createdAt: -1 })
      .limit(200)
      .lean();
    return res.json(items);
  } catch (error) {
    return res.status(500).json({ error: "Failed to fetch size matrixes" });
  }
});

// Obtém matriz por id
router.get("/:id", async (req, res) => {
  try {
    const item = await SizeMatrix.findById(req.params.id).lean();
    if (!item) return res.status(404).json({ error: "Not found" });
    return res.json(item);
  } catch (error) {
    return res.status(400).json({ error: "Invalid id" });
  }
});

// Cria matriz
router.post("/", async (req, res) => {
  try {
    const { name, sizes } = req.body;
    if (!name || String(name).trim().length === 0) {
      return res.status(400).json({ error: "name is required" });
    }
    if (!Array.isArray(sizes) || sizes.length === 0) {
      return res.status(400).json({ error: "sizes is required" });
    }
    const cleaned = sizes.map((s) => String(s).trim()).filter(Boolean);
    if (cleaned.length === 0) {
      return res.status(400).json({ error: "sizes is required" });
    }
    const created = await SizeMatrix.create({
      name: String(name).trim(),
      sizes: cleaned
    });
    return res.status(201).json(created);
  } catch (error) {
    return res.status(500).json({ error: "Failed to create size matrix" });
  }
});

// Atualiza matriz
router.put("/:id", async (req, res) => {
  try {
    const { name, sizes } = req.body;
    if (!name || String(name).trim().length === 0) {
      return res.status(400).json({ error: "name is required" });
    }
    if (!Array.isArray(sizes) || sizes.length === 0) {
      return res.status(400).json({ error: "sizes is required" });
    }
    const cleaned = sizes.map((s) => String(s).trim()).filter(Boolean);
    if (cleaned.length === 0) {
      return res.status(400).json({ error: "sizes is required" });
    }
    const updated = await SizeMatrix.findByIdAndUpdate(
      req.params.id,
      {
        name: String(name).trim(),
        sizes: cleaned
      },
      { new: true }
    ).lean();
    if (!updated) return res.status(404).json({ error: "Not found" });
    return res.json(updated);
  } catch (error) {
    return res.status(400).json({ error: "Invalid id" });
  }
});

// Remove matriz
router.delete("/:id", async (req, res) => {
  try {
    const deleted = await SizeMatrix.findByIdAndDelete(req.params.id).lean();
    if (!deleted) return res.status(404).json({ error: "Not found" });
    return res.json({ ok: true });
  } catch (error) {
    return res.status(400).json({ error: "Invalid id" });
  }
});

export default router;
