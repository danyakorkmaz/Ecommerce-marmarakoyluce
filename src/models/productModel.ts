import mongoose, { Schema, Document, ObjectId } from "mongoose";

export interface IProduct extends Document {
    title: string;
    description: string;
    image: string;
    otherImages: string[];
    SKU: string; // Stok kodu (Stock Keeping Unit)
    categoryId: ObjectId;
    subcategoryId: ObjectId;
    priceTL: number;
    discountedPriceTL: number;
    measureUnit: string; // Ölçü birimi (ör. "kg", "lt", "adet")
    measureValue: number; // Ölçü birimi değeri (ör. 1, 2.5)
    stockCount: number;
    recentlyAddedFlag: boolean; // Son eklenenler arasında mı? (true/false)
    viewCount: Map<string, number>; // Görüntülenme sayısı
    favouriteCount: number;
    addedToCartCount: Map<string, number>;
    orderedCount: Map<string, number>;
    createdBy: ObjectId;
    updatedBy: ObjectId;
    brand: string; // Marka ID
}

const productSchema = new Schema<IProduct>({
    title: { type: String, required: true },
    description: { type: String, default: "" },
    image: { type: String, required: true },
    otherImages: { type: [String], default: [] },
    SKU: { type: String, required: true, unique: true },
    categoryId: { type: mongoose.Schema.Types.ObjectId, ref: "Category", required: true },
    subcategoryId: { type: mongoose.Schema.Types.ObjectId, ref: "Subcategory", required: true },
    priceTL: { type: Number, required: true },
    discountedPriceTL: { type: Number, default: null },
    measureUnit: { type: String, required: true },
    measureValue: { type: Number, required: true },
    stockCount: { type: Number, required: true, default: 0 },
    recentlyAddedFlag: { type: Boolean, default: false },
    viewCount: { type: Map, of: Number, default: () => new Map([["total", 0]]) },
    favouriteCount: { type: Number, default: 0 },
    addedToCartCount: { type: Map, of: Number, default: () => new Map([["total", 0]]) },
    orderedCount: { type: Map, of: Number, default: () => new Map([["total", 0]]) },
    createdBy: { type: Schema.Types.ObjectId, ref: "User", required: true }, // Kullanıcı ilişkisi için ObjectId kullanılabilir
    updatedBy: { type: Schema.Types.ObjectId, ref: "User", required: true }, // Kullanıcı ilişkisi için ObjectId kullanılabilir
    brand: { type: String, required: true }, // Marka ID
},
    {
        timestamps: true, // createDate otomatik eklenecek
    }
);

const productModel = mongoose.model<IProduct>('Product', productSchema);

export default productModel;
