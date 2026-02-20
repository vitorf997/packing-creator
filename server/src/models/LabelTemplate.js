import mongoose from "mongoose";

const labelTemplateSchema = new mongoose.Schema(
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
    type: { type: String, default: "A6_LANDSCAPE", index: true },
    layout: {
      orientation: { type: String, default: "landscape" },
      brandName: { type: String, default: "FERMIR" },
      brandBgColor: { type: String, default: "#8dc63f" },
      brandTextColor: { type: String, default: "#ffffff" },
      referenceField: { type: String, default: "model" },
      colourField: { type: String, default: "po" },
      topLeftField: { type: String, default: "model" },
      topRightField: { type: String, default: "po" },
      emptyRows: { type: Number, default: 4 },
      showRemainderLabel: { type: Boolean, default: true }
    }
  },
  { timestamps: true }
);

export default mongoose.model("LabelTemplate", labelTemplateSchema);
