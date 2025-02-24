import mongoose from "mongoose";
import userModel from "../models/userModel";
import categoryModel from "../models/categoryModel";
import subcategoryModel from "../models/subcategoryModel";

interface CreateSubcategoryParams {
  name: string;
  description?: string;
  categoryId: string; // String olarak alınacak, ObjectId'ye çevrilecek
  brands: string[];
  creator: string;
}
export const createSubcategory = async ({
  name,
  description,
  categoryId,
  brands,
  creator,
}: CreateSubcategoryParams) => {
  try {
    if (!mongoose.Types.ObjectId.isValid(categoryId)) {
      return {
        data: "Geçersiz kategoriID . Lütfen Geçerli bir kategoriID yazınız! ",
        statusCode: 400,
      };
    }
    if (!mongoose.Types.ObjectId.isValid(creator)) {
      return {
        data: "Geçersiz creatorID. Lütfen geçerli bir creatorID yazınız!",
        statusCode: 400,
      };
    }

    // creator ID'sini ObjectId'ye çevir
    const creatorObjectId = new mongoose.Types.ObjectId(creator);

    // Kullanıcı kontrolü
    const findUser = await userModel.findById(creatorObjectId);
    if (!findUser) {
      return { data: "Kullanıcı bulunamadı!", statusCode: 404 };
    }
    if (!findUser.adminFlag) {
      return {
        data: "Yetkiniz yok! Sadece adminler alt kategori ekleyebilir.",
        statusCode: 403,
      };
    }

    // categoryId'nin geçerli olup olmadığını kontrol et
    const categoryObjectId = new mongoose.Types.ObjectId(categoryId);
    const findCategory = await categoryModel.findById(categoryObjectId);
    if (!findCategory) {
      return { data: "Belirtilen kategori bulunamadı!", statusCode: 404 };
    }

    // Aynı isimde bir alt kategori var mı?
    const findSubcategory = await subcategoryModel.findOne({
      name,
      categoryId: categoryObjectId,
    });
    if (findSubcategory) {
      return { data: "Bu alt kategori zaten mevcut!", statusCode: 400 };
    }

    // ✅ Yeni alt kategoriyi oluştur ve ilgili kategoriye ekle
    const newSubcategory = new subcategoryModel({
      name,
      description,
      categoryId: categoryObjectId,
      brands,
      creator: creatorObjectId,
    });

    const savedSubcategory = await newSubcategory.save();

    // 📌 Dönen veriyi sadece istenen alanlarla düzenle
    const responseData = {
      name: savedSubcategory.name,
      description: savedSubcategory.description,
      categoryName: findCategory.name, // Kategori adı
      brands: savedSubcategory.brands,
      creator: {
        name: `${findUser.name} ${findUser.surname}`, // Kullanıcının adı eklendi
      },
    };
    return { data: responseData, statusCode: 201 };
  } catch (error) {
    return { data: "Alt kategori oluşturulamadı!", statusCode: 500 };
  }
};
/************************************************************************************* */

//update subcategory fonksiyon
