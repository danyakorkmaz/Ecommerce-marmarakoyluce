import mongoose, { Schema, ObjectId, Document } from "mongoose";
import { IProduct } from "./productModel";

const CartStatusEnum = ["active", "completed"]

export interface ICartItem {
    product: IProduct; // Ürün ID'si
    quantity: number; // Ürün miktarı
    unitPrice: number; // Birim fiyat
    discount: number; // Ürün başına indirim
}

export interface ICart extends Document {
    userID: ObjectId | string; // Kullanıcı ID'si
    items: ICartItem[]; // Sepet öğeleri
    totalCount: number; // Sepetteki toplam ürün sayısı
    totalPrice: number; // Sepetin toplam fiyatı
    status: "active" | "completed"
}

const cartItemSchema = new Schema<ICartItem>({
    product: { type: Schema.Types.ObjectId, ref: "Product", required: true },
    quantity: { type: Number, required: true, default: 1 },
    unitPrice: { type: Number, required: true },
    discount: { type: Number, default: 0 },
});

const cartSchema = new Schema<ICart>({
    userID: { type: Schema.Types.ObjectId, ref: "User", required: true },
    items: { type: [cartItemSchema], default: [] },
    totalCount: { type: Number, required: true, default: 0 },
    totalPrice: { type: Number, required: true, default: 0 },
    status: {type: String, enum:CartStatusEnum, default:"active"}
});

export const cartModel = mongoose.model<ICart>("Cart", cartSchema);
