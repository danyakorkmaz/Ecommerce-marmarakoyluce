import mongoose from "mongoose";
import categoryModel from "../models/categoryModel";
import subcategoryModel from "../models/subcategoryModel";
import userModel from "../models/userModel"; // Kullanıcı modelini içe aktar

// Create Category fonksiyonu
interface CreateCategoryParams {
  name: string;
  description?: string;
  image: string;
  creator: string; // `creator` ID olarak string alınacak
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
      creator: creatorObjectId,
    });

    const savedCategory = await newCategory.save();

    // **Dönen response'ta ID yerine creator'ın adını ekledik**
    return {
      data: {
        name: savedCategory.name,
        description: savedCategory.description,
        image: savedCategory.image,
        creatorName: `${findUser.name} ${findUser.surname}`, // Creator'ın ismi ve soyismi
      },
      statusCode: 201,
    };
  } catch (error) {
    console.error("Kategori oluşturma hatası:", error);
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
        data: "Geçersiz kategori ID. Lütfen geçerli bir kategori ID yazınız!",
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

    // Kategoriyi güncelle
    const updatedCategory = await categoryModel.findByIdAndUpdate(
      categoryId,
      { $set: updateFields }, // Sadece verilen alanları güncelle
      { new: true } // Güncellenmiş veriyi döndür
    );

    if (!updatedCategory) {
      return { data: "Kategori güncellenemedi!", statusCode: 500 };
    }

    // Creator'ın bilgilerini getir
    const creator = await userModel.findById(updatedCategory.creator).select("name surname");

    return {
      data: {
        name: updatedCategory.name,
        description: updatedCategory.description,
        image: updatedCategory.image,
        creatorName: creator ? `${creator.name} ${creator.surname}` : "Bilinmeyen Kullanıcı",
      },
      statusCode: 200,
    };
  } catch (error) {
    console.error("Kategori güncelleme hatası:", error);
    return { data: "Kategori güncellenemedi!", statusCode: 500 };
  }
};

/************************************************************************************* */

//delete category fonksiyonimport mongoose from "mongoose";

interface DeleteCategoryParams {
  categoryId: string;
}

export const deleteCategory = async ({ categoryId }: DeleteCategoryParams) => {
  try {
    // 1️⃣ **Geçerli bir ObjectId mi?**
    if (!mongoose.Types.ObjectId.isValid(categoryId)) {
      return { data: "Geçersiz kategori ID!", statusCode: 400 };
    }

    // 2️⃣ **Kategori var mı?**
    const category = await categoryModel.findById(categoryId);
    if (!category) {
      return { data: "Kategori bulunamadı!", statusCode: 404 };
    }

    // 3️⃣ **Önce alt kategorileri sil**
    await subcategoryModel.deleteMany({ categoryId });

    // 4️⃣ **Sonra kategoriyi sil**
    const deletedCategory = await categoryModel.findByIdAndDelete(categoryId);

    if (!deletedCategory) {
      return { data: "Kategori silinemedi!", statusCode: 500 };
    }

    return { data: "Kategori ve ilgili alt kategoriler başarıyla silindi!", statusCode: 200 };
  } catch (error) {
    console.error("Kategori silme hatası:", error);
    return { data: "Kategori silinirken bir hata oluştu!", statusCode: 500 };
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
    return { data: "Kategoriler getirilemedi!", statusCode: 500 };
  }
};

