import mongoose, { Schema, Document, ObjectId, model } from "mongoose";

export interface ISubcategory extends Document {
    name: string;
    categoryId: ObjectId;
    description?: string;
    brands: Map<string, ObjectId[]>; // Her marka adı bir key olacak, değeri productId dizisi olacak
    createdBy: ObjectId;
    updatedBy: ObjectId;
}

const subcategorySchema = new Schema<ISubcategory>(
    {
        name: { type: String, required: true },
        categoryId: { type: mongoose.Schema.Types.ObjectId, ref: "Category", required: true },
        description: { type: String },
        brands:  { type: Map, of: [mongoose.Schema.Types.ObjectId], default: () => new Map() }, // Marka adı key, değeri productId dizisi olacak
        createdBy: { type: Schema.Types.ObjectId, ref: "User", required: true },
        updatedBy: { type: Schema.Types.ObjectId, ref: "User", required: true },
    },
    {
        timestamps: true, // createDate otomatik eklenecek
    }
);

const subcategoryModel = model<ISubcategory>("Subcategory", subcategorySchema);
export default subcategoryModel;
