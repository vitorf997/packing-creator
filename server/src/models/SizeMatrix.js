import mongoose from "mongoose";

const sizeMatrixSchema = new mongoose.Schema(
  {
    name: { type: String, required: true, index: true },
    sizes: { type: [String], required: true }
  },
  { timestamps: true }
);

export default mongoose.model("SizeMatrix", sizeMatrixSchema);
