import mongoose, {Schema, Document, ObjectId} from "mongoose";


export interface ICategory extends Document{
    name: string;
    description?: string;
    image: string;
    creator: ObjectId ;
}

const categorySchema = new Schema <ICategory> ({
    name: {type:String, required: true},
    description: {type: String},
    image:{type: String, required: true},
    creator:{ type: Schema.Types.ObjectId, ref: "User", required: true }, // Kullanıcı ilişkisi için ObjectId kullanılabilir
}, 
 {
    timestamps: true, // createDate otomatik eklenecek
}
);

const categoryModel = mongoose.model<ICategory>("Category", categorySchema);
export default categoryModel;