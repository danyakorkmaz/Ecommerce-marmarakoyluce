import mongoose, { Schema, Document, ObjectId } from "mongoose";

export interface IAddress extends Document {
    userId: ObjectId;
    type: "ev" | "iş" | "diğer";
    country: string;
    city: string;
    district: string; /** ilçe */
    subdistrict : string; /** semt */
    neighborhood: string; /** mahalle  */
    street: string;
    boulevard?: string; /** cadde*/
    avenue: string; /** sokak*/
    buildingNo: string;  /** binaNo */
    doorNo: string;  /** kapıNo*/
    floor: string;  /** kat */
    apartmentNo: string;  /** DaireNo*/
    postalCode: string;
    fullAddress: string;
    googleMapCoordinates?: { lat: number; lng: number };
    validFlag: boolean;
    isDefaultFlag: boolean;
}

const addressSchema = new Schema<IAddress>({
    userId: { type: Schema.Types.ObjectId, ref: "User", required: true },
    type: { type: String, enum: ["ev", "iş", "diğer"], required: true },
    country: { type: String, required: true },
    city: { type: String, required: true },
    district: { type: String, required: true },
    subdistrict: { type: String, required: true },
    neighborhood: { type: String, required: true },
    street: { type: String, required: true },
    boulevard: { type: String },
    avenue: { type: String, required: true  },
    buildingNo: { type: String },
    doorNo: { type: String , required: true },
    floor: { type: String , required: true },
    apartmentNo: { type: String, required: true},
    postalCode: { type: String, required: true },
    fullAddress: { type: String, required: true },
    googleMapCoordinates: {
        lat: { type: Number },
        lng: { type: Number }
    },
    validFlag: { type: Boolean, default: true },
    isDefaultFlag: { type: Boolean, default: false }
}, {
    timestamps: true // createdAt ve updatedAt otomatik eklenecek
});

const addressModel = mongoose.model<IAddress>('Address', addressSchema);

export default addressModel;