import mongoose from "mongoose";

const clientLabelFieldSchema = new mongoose.Schema(
  {
    fieldId: { type: String, required: true },
    name: { type: String, required: true }
  },
  { _id: false }
);

const clientSchema = new mongoose.Schema(
  {
    name: { type: String, required: true, index: true },
    code: { type: String, default: "", index: true },
    contact: { type: String, default: "", index: true },
    notes: { type: String, default: "" },
    labelFields: { type: [clientLabelFieldSchema], default: [] },
    labelTemplateId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "LabelTemplate",
      default: null
    }
  },
  { timestamps: true }
);

export default mongoose.model("Client", clientSchema);
