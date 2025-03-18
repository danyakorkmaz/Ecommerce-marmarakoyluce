import mongoose, { Schema, ObjectId, Document } from "mongoose";


export interface IOrderItem {
    productTitle: string;
    productImage: string;
    unitPrice: number;
    quantity: number;   
    discount: number;      // Ürün için uygulanan indirim
  }
  
  // IOrder
  export interface IOrder extends Document {
    userID: ObjectId | string;                // Kullanıcı kimliği
    orderDate: Date;               // Sipariş tarihi
    orderItems: IOrderItem[];      // Siparişteki ürünlerin listesi
    totalCount: number;            // Toplam ürün miktarı
    totalPrice: number;            // Toplam ürün fiyatı
    totalFinalPrice: number;       // Nihai toplam fiyat (indirim dahil)
    deliveryType: string;          // Teslimat türü
    addressID: ObjectId | string;             // Adres kimliği
    cancelFlag: boolean;           // İptal durumu
    cancelDate?: Date;             // İptal tarihi
    orderStatus: string;           // Sipariş durumu
    deliveryCost: number;          // Teslimat ücreti
    discountCost: number;          // Toplam indirim
    paraPuanUsedFlag: boolean;     // Para puan kullanımı durumu
    paraPuanCount: number;         // Kullanılan para puan miktarı
  }

const OrderItemSchema = new Schema<IOrderItem>({
    productTitle: { type: String, required: true }, // Ürün adı
    productImage: { type: String, required: true }, // Ürün görseli
    unitPrice: { type: Number, required: true }, // Ürün birim fiyatı
    quantity: { type: Number, required: true }, // Ürün miktarı
    discount: { type: Number, default: 0 }, // Ürün indirimi (varsayılan: 0)
})

const OrderSchema = new Schema<IOrder>({
    orderItems: [OrderItemSchema], // Sipariş ürünleri
    totalCount: { type: Number, required: true }, // Toplam ürün adedi
    totalPrice: { type: Number, required: true }, // İndirim öncesi toplam fiyat
    totalFinalPrice: { type: Number, required: true }, // İndirim sonrası toplam fiyat
    deliveryType: { type: String, enum: ["Kargo", "Mağaza Teslim"], required: true }, // Teslimat türü
    addressID: { type: Schema.Types.ObjectId, ref: "Address", required: true }, // Teslimat adresi
    userID: { type: Schema.Types.ObjectId, ref: "User", required: true }, // Kullanıcı kimliği
    orderDate: { type: Date, default: Date.now }, // Sipariş tarihi
    cancelFlag: { type: Boolean, default: false }, // İptal durumu (varsayılan: false)
    cancelDate: { type: Date }, // İptal tarihi (eğer varsa)
    orderStatus: { 
      type: String, 
      enum: ["Hazırlanıyor", "Kargoda", "Teslim Edildi", "İptal Edildi"], 
      default: "Hazırlanıyor" 
    }, // Sipariş durumu
    deliveryCost: { type: Number, required: true }, // Teslimat ücreti
    discountCost: { type: Number, default: 0 }, // Toplam indirim miktarı
    paraPuanUsedFlag: { type: Boolean, default: false }, // Para puan kullanımı
    paraPuanCount: { type: Number, default: 0 }, // Kullanılan para puan miktarı
  });


export const orderModel = mongoose.model<IOrder>("Order", OrderSchema);