import mongoose from "mongoose";

const packingEntrySchema = new mongoose.Schema(
  {
    size: { type: String, required: true },
    itemFields: {
      type: [
        new mongoose.Schema(
          {
            fieldId: { type: String, required: true },
            name: { type: String, required: true },
            value: { type: String, default: "" }
          },
          { _id: false }
        )
      ],
      default: []
    },
    boxFrom: { type: Number, default: 0 },
    boxTo: { type: Number, default: 0 },
    unitsPerBox: { type: Number, default: 0 },
    remainBox: { type: Number, default: 0 },
    remainUnits: { type: Number, default: 0 },
    totalPerSize: { type: Number, default: 0 }
  },
  { _id: false }
);

const labelFieldValueSchema = new mongoose.Schema(
  {
    fieldId: { type: String, required: true },
    name: { type: String, required: true },
    value: { type: String, default: "" }
  },
  { _id: false }
);

const labelItemSchema = new mongoose.Schema(
  {
    itemId: { type: String, required: true },
    fields: { type: [labelFieldValueSchema], default: [] }
  },
  { _id: false }
);

const packingListSchema = new mongoose.Schema(
  {
    po: { type: String, default: "", index: true },
    model: { type: String, default: "", index: true },
    clientId: { type: mongoose.Schema.Types.ObjectId, ref: "Client", required: true },
    sizeMatrixId: { type: mongoose.Schema.Types.ObjectId, ref: "SizeMatrix", required: true },
    sizeMatrix: [{ type: String, required: true }],
    labelItems: { type: [labelItemSchema], default: [] },
    entries: { type: [packingEntrySchema], default: [] },
    totalUnits: { type: Number, default: 0 },
    notes: { type: String, default: "" }
  },
  { timestamps: true }
);

export default mongoose.model("PackingList", packingListSchema);
