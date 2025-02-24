import mongoose, {Schema, Document, ObjectId, model} from "mongoose";

export interface ISubcategory extends Document{
    name: string;
    categoryId: ObjectId ;
    description?: string;
    brands: string[];
    creator: ObjectId ;
}

const subcategorySchema = new Schema <ISubcategory> ({
    name: {type:String, required: true},
    categoryId: {type: mongoose.Schema.Types.ObjectId, ref: 'Category', required: true },
    description: {type: String},
    brands:{type: [String]},
    creator:{ type: Schema.Types.ObjectId, ref: "User", required: true }, // Kullanıcı ilişkisi için ObjectId kullanılabilir
}, 
 {
    timestamps: true, // createDate otomatik eklenecek
}
);


const subcategoryModel = mongoose.model<ISubcategory>("Subcategory", subcategorySchema);
export default subcategoryModel;