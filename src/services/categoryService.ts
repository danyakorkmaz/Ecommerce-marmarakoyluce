import mongoose from "mongoose";
import categoryModel from "../models/categoryModel";
import userModel from "../models/userModel"; // Kullanıcı modelini içe aktar

// Create Category fonksiyonu için TypeScript arayüzü
interface CreateCategoryParams {
    name: string;
    description?: string;
    image: string;
    creator: string; // `creator` alanını string olarak alacağız
}

export const createCategory = async ({ name, description, image, creator }: CreateCategoryParams) => {
    try {
        // String olarak gelen `creator` ID'sini `ObjectId` formatına çevir
        const creatorObjectId = new mongoose.Types.ObjectId(creator);

        // Kullanıcının var olup olmadığını kontrol et
        const findUser = await userModel.findById(creatorObjectId);

        if (!findUser) {
            return { data: "Kullanıcı bulunamadı!", statusCode: 404 };
        }

        // Kullanıcı admin mi kontrol et
        if (!findUser.adminFlag) {
            return { data: "Yetkiniz yok! Sadece adminler kategori ekleyebilir.", statusCode: 403 };
        }

        // Aynı isimde bir kategori var mı kontrol et
        const findCategory = await categoryModel.findOne({ name });

        if (findCategory) {
            return { data: "Bu kategori zaten mevcut!", statusCode: 400 };
        }

        // Yeni kategori oluştur
        const newCategory = new categoryModel({
            name,
            description,
            image,
            creator: creatorObjectId, // Burada da ObjectId olarak kaydediyoruz
        });

        const savedCategory = await newCategory.save();
        return { data: savedCategory, statusCode: 201 };
    } catch (error) {
        return { data: "Kategori oluşturulamadı!", statusCode: 500 };
    }
};
