import mongoose, { Schema, Document, ObjectId } from "mongoose";

export interface IProduct extends Document {
    title: string; 
    description: string; 
    image: string; 
    otherImages: string[]; 
    SKU: string; // Stok kodu (Stock Keeping Unit)
    categoryId: string;
    subcategoryId: string;
    price: number; 
    discountedPrice: number; 
    measureUnit: string; // Ölçü birimi (ör. "kg", "lt", "adet")
    measureValue: number; // Ölçü birimi değeri (ör. 1, 2.5)
    stockCount: number;
    recentlyAddedFlag: boolean; // Son eklenenler arasında mı? (true/false)
    viewCount: number; // Görüntülenme sayısı
    uniqueLoggedViewCount: number; // Benzersiz kullanıcılar tarafından görüntülenme sayısı
    favouriteCount: number;
    addedToCartCount: number; 
    createdBy: ObjectId ;
    updatedBy: ObjectId ;
    brand: string; // Marka ID

}

const productSchema = new Schema<IProduct>({
    title: { type: String, required: true },
    description: { type: String, required: true },
    image: { type: String, required: true },
    otherImages: { type: [String], default: [] },
    SKU: { type: String, required: true, unique: true },
    categoryId: { type: String, required: true },
    subcategoryId: { type: String, required: true },
    price: { type: Number, required: true },
    discountedPrice: { type: Number, default: 0 },
    measureUnit: { type: String, required: true },
    measureValue: { type: Number, required: true },
    stockCount: { type: Number, required: true, default: 0 },
    recentlyAddedFlag: { type: Boolean, default: false },
    viewCount: { type: Number, default: 0 },
    uniqueLoggedViewCount: { type: Number, default: 0 },
    favouriteCount: { type: Number, default: 0 },
    addedToCartCount: { type: Number, default: 0 },
    createdBy:{ type: Schema.Types.ObjectId, ref: "User", required: true }, // Kullanıcı ilişkisi için ObjectId kullanılabilir
    updatedBy:{ type: Schema.Types.ObjectId, ref: "User", required: true }, // Kullanıcı ilişkisi için ObjectId kullanılabilir
    brand:  { type: String, required: true }, // Marka ID
}, 
 {
    timestamps: true, // createDate otomatik eklenecek
}
);

const productModel = mongoose.model<IProduct>('Product', productSchema);

export default productModel;
