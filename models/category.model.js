import mongoose, { Schema } from "mongoose";
//Alhamdulilah---The start of the new Module. of the course
const categorySchema = new Schema(
  {
    name: {
      type: String,
      require: true,
    },
    icon: {
      type: String,
      require: true,
    },
  },
  { timestamps: true },
);

const Category = mongoose.model("Category", categorySchema);

export default Category;
