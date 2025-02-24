import mongoose from "mongoose";
import categoryModel from "../models/categoryModel";
import userModel from "../models/userModel"; // Kullanıcı modelini içe aktar
import router from "../routes/categoryRoute";

// Create Category fonksiyonu
interface CreateCategoryParams {
  name: string;
  description?: string;
  image: string;
  creator: string; // `creator` alanını string olarak alacağız
}

export const createCategory = async ({
  name,
  description,
  image,
  creator,
}: CreateCategoryParams) => {
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
      return {
        data: "Yetkiniz yok! Sadece adminler kategori ekleyebilir.",
        statusCode: 403,
      };
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
/************************************************************************************* */

//update category fonksiyon

interface UpdateCategoryParams {
  categoryId: string; // Güncellenecek kategori ID'si
  name?: string; // Yeni kategori adı (opsiyonel)
  description?: string; // Açıklama (opsiyonel)
  image?: string; // Resim (opsiyonel)
}

export const updateCategory = async ({
  categoryId,
  name,
  description,
  image,
}: UpdateCategoryParams) => {
  try {
    if (!mongoose.Types.ObjectId.isValid(categoryId)) {
      return {
        data: "Geçersiz kategoriID . Lütfen Geçerli bir kategoriID yazınız! ",
        statusCode: 400,
      };
    }
    // Kategoriyi ID ile bul
    const category = await categoryModel.findById(categoryId);
    if (!category) {
      return { data: "Kategori bulunamadı!", statusCode: 404 };
    }

    // Eğer yeni isim verilmişse ve mevcut isimden farklıysa, çakışma kontrolü yap
    if (name && name !== category.name) {
      const existingCategory = await categoryModel.findOne({ name });
      if (existingCategory) {
        return {
          data: "Bu isimde başka bir kategori zaten var!",
          statusCode: 400,
        };
      }
    }
    // Güncellenecek alanları belirle
    const updateFields: Partial<UpdateCategoryParams> = {};
    if (name) updateFields.name = name;
    if (description) updateFields.description = description;
    if (image) updateFields.image = image;

    // Model.findByIdAndUpdate(id, update, options)
    // id → Güncellenecek dokümanın _id değeri.
    //update → Güncellenecek alanları içeren nesne.
    // options → Güncelleme sonrası dönecek veriyi ve ek ayarları belirler.
    const updatedCategory = await categoryModel.findByIdAndUpdate(
      categoryId,
      { $set: updateFields }, // Sadece verilen alanları güncelle
      { new: true } // Güncellenmiş veriyi döndür
    );

    return { data: updatedCategory, statusCode: 200 };
  } catch (error) {
    return { data: "Kategori güncellenemedi!", statusCode: 500 };
  }
};
/************************************************************************************* */

//delete category fonksiyon
interface DeleteCategoryParams {
  categoryId: string;
}

export const deleteCategory = async ({ categoryId }: DeleteCategoryParams) => {
  try {
    // Kategori ID geçerli mi kontrol et
    if (!mongoose.Types.ObjectId.isValid(categoryId)) {
      return { data: "Geçersiz kategori ID!", statusCode: 400 };
    }

    // Veritabanında böyle bir kategori var mı kontrol et
    const category = await categoryModel.findById(categoryId);
    if (!category) {
      return { data: "Kategori bulunamadı!", statusCode: 404 };
    }

    // Kategoriyi sil
    await categoryModel.findByIdAndDelete(categoryId);

    return { data: "Kategori başarıyla silindi!", statusCode: 200 };
  } catch (error) {
    console.error("Kategori silme hatası:", error);
    return { data: "Kategori silinirken hata oluştu!", statusCode: 500 };
  }
};
/************************************************************************************* */

//list all category fonksiyon
export const getAllCategories = async () => {
  try {
    const categories = await categoryModel
      .find()
      .select("name description image -_id"); // Tüm kategorileri getir

    if (!categories.length) {
      return { data: "Henüz kategori eklenmemiş!", statusCode: 404 };
    }

    return { data: categories, statusCode: 200 };
  } catch (error) {
    console.error("Kategoriler getirilirken hata oluştu:", error);
    return { data: "Kategoriler getirilemedi!", statusCode: 500 };
  }
};

