import mongoose, { Schema, ObjectId, Document, Types } from "mongoose";//mongoDB çalışmak için mongoose kullanılır

//Interface TypeScript'in veri tiplerini denetlemesini sağlar. req.body ile aynı olması gerekiyor userRouterdeki gibi
export interface IUser extends Document {
    name: string;
    surname: string;
    telNumber: string;
    gender: string;
    email: string;
    password: string;
    birthdate: Date;
    profileImage: string;
    favouriteProductIds: Types.ObjectId[];
    paraPuanID: ObjectId | string;
    getEmailNotificationFlag: boolean;
    adminFlag: boolean;
}
//veritabana veriler eklemek için
const userSchema = new Schema<IUser>({
    name: { type: String, required: true },
    surname: { type: String, required: true },
    telNumber: { type: String, default: "" },
    email: { type: String, required: true },
    password: { type: String, required: true },
    gender: { type: String, required: true },
    profileImage: { type: String, default: "" },
    birthdate: { type: Date, default: null }, // TODO: This would be changed to required field after Frontend Integration
    favouriteProductIds: [],
    paraPuanID: { type: Schema.Types.ObjectId, ref: "ParaPuan", default: null },
    getEmailNotificationFlag: { type: Boolean, required: true },
    adminFlag: { type: Boolean, required: true , default: false }
})


//mongoose.model<IUser>('User', userSchema):

//mongoose.model fonksiyonu ile 'User' adında bir model oluşturuluyor.
//IUser tipi, TypeScript tip denetimi için kullanılır.
//userSchema, MongoDB koleksiyonunun yapısını tanımlar.
//'User' model ismi, MongoDB koleksiyonunun ismi olarak kullanılır (çoğul ve küçük harflerle 'users' olarak kaydedilir).

const userModel = mongoose.model<IUser>('User', userSchema);

export default userModel;