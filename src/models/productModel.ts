import mongoose, { Schema, Document } from "mongoose";



export interface IProduct extends Document {
    createDate: string; // ISO formatında tarih
    creator: string; // Ürünü oluşturan kullanıcı ID'si veya adı
    title: string; 
    description: string; 
    image: string; // 
    otherImages: string[]; 
    SKU: string; // Stok kodu (Stock Keeping Unit)
    categoryID: string;
    subcategoryID: string;
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

}

const productSchema = new Schema<IProduct>({
    createDate: { type: String, default: () => new Date().toISOString() },
    creator: { type: String },
    title: { type: String, required: true },
    description: { type: String, required: true },
    image: { type: String, required: true },
    otherImages: { type: [String], default: [] },
    SKU: { type: String, required: true, unique: true },
    categoryID: { type: String, required: true },
    subcategoryID: { type: String, required: true },
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
});

const productModel = mongoose.model<IProduct>('Product', productSchema);

export default productModel;