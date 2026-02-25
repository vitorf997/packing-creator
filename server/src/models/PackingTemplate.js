import mongoose from "mongoose";

const templateHeaderFieldSchema = new mongoose.Schema(
  {
    label: { type: String, required: true },
    source: { type: String, required: true }
  },
  { _id: false }
);

const packingTemplateSchema = new mongoose.Schema(
  {
    name: { type: String, required: true, index: true },
    key: { type: String, required: true, unique: true, index: true },
    isDefault: { type: Boolean, default: false, index: true },
    active: { type: Boolean, default: true, index: true },
    clientId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Client",
      default: null,
      index: true
    },
    type: { type: String, default: "A4_PORTRAIT", index: true },
    layout: {
      orientation: { type: String, default: "portrait" },
      companyName: { type: String, default: "FERMIR" },
      title: {
        type: String,
        default: "LISTA DE CONTEÚDO / PACKING LIST"
      },
      topLeftField: { type: String, default: "po" },
      topRightField: { type: String, default: "model" },
      headerFields: { type: [templateHeaderFieldSchema], default: [] },
      detailFieldColumnIds: { type: [String], default: [] },
      emptyRows: { type: Number, default: 10 },
      showSummary: { type: Boolean, default: true }
    }
  },
  { timestamps: true }
);

export default mongoose.model("PackingTemplate", packingTemplateSchema);
