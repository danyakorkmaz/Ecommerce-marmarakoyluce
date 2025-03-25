import mongoose, { ObjectId } from "mongoose";
import categoryModel from "../models/categoryModel";
import subcategoryModel from "../models/subcategoryModel";
import { IUser } from "../models/userModel"; // Kullanıcı modelini içe aktar
import productModel from "../models/productModel";

// Create Category fonksiyonu
interface CreateCategoryParams {
  user: IUser;
  name: string;
  description?: string;
  image: string;
}

export const createCategory = async ({ user, name, description, image }: CreateCategoryParams) => {
  try {
    //  Eksik Alan Kontrolleri**
    if (!name || !image) {
      return { data: "Lütfen tüm zorunlu alanları eksiksiz doldurun!", statusCode: 400 };
    }
    if (!user.adminFlag) return { data: "Yetkiniz yok!", statusCode: 403 };

    const findCategory = await categoryModel.findOne({ name });
    if (findCategory) return { data: "Bu kategori zaten mevcut!", statusCode: 400 };

    const newCategory = new categoryModel({ name, description, image, createdBy: user._id, updatedBy: user._id });
    const savedCategory = await newCategory.save();

    return {
      data: {
        name: savedCategory.name,
        description: savedCategory.description,
        image: savedCategory.image,
        creatorName: `${user.name} ${user.surname}`,
      },
      statusCode: 201,
    };
  } catch (error) {
    console.error("Kategori oluşturma hatası:", error);
    return { data: "Kategori oluşturulamadı!", statusCode: 500 };
  }
};

// Update Category fonksiyonu
interface UpdateCategoryParams {
  user: IUser;
  categoryId: string;
  name?: string;
  description?: string;
  image?: string;
}

export const updateCategory = async ({ user, categoryId, name, description, image }: UpdateCategoryParams) => {
  try {
    if (!mongoose.Types.ObjectId.isValid(categoryId)) return { data: "Geçersiz kategori ID!", statusCode: 400 };

    if (!categoryId) {
      return { data: "Lütfen tüm zorunlu alanları eksiksiz doldurun!", statusCode: 400 };
    }

    const category = await categoryModel.findById(categoryId);
    if (!category) return { data: "Kategori bulunamadı!", statusCode: 404 };

    if (name && name !== category.name) {
      const existingCategory = await categoryModel.findOne({ name });
      if (existingCategory) return { data: "Bu isimde başka bir kategori var!", statusCode: 400 };
    }

    if (!user.adminFlag) return { data: "Yetkiniz yok!", statusCode: 403 };

    const updateFields: Partial<UpdateCategoryParams> = {};
    (updateFields as any).updatedBy = user._id
    if (name && category.name !== name) updateFields.name = name;
    if (description && category.description !== description) updateFields.description = description;
    if (image && category.image !== image) updateFields.image = image;

    if (Object.keys(updateFields).length == 1) return { data: "Güncellenmiş veri girilmedi!", statusCode: 400 };

    const updatedCategory = await categoryModel.findByIdAndUpdate(categoryId, { $set: updateFields }, { new: true });
    if (!updatedCategory) return { data: "Kategori güncellenemedi!", statusCode: 500 };

    return {
      data: {
        name: updatedCategory.name,
        description: updatedCategory.description,
        image: updatedCategory.image,
        updaterName: `${user.name} ${user.surname}`,
      },
      statusCode: 200,
    };
  } catch (error) {
    console.error("Kategori güncelleme hatası:", error);
    return { data: "Kategori güncellenemedi!", statusCode: 500 };
  }
};

// Delete Category fonksiyonu
interface DeleteCategoryParams {
  user: IUser;
  categoryId: string;
}

export const deleteCategory = async ({ user, categoryId }: DeleteCategoryParams) => {
  try {
    if (!user.adminFlag) return { data: "Yetkiniz yok!", statusCode: 403 };

    if (!mongoose.Types.ObjectId.isValid(categoryId)) return { data: "Geçersiz kategori ID!", statusCode: 400 };

    const category = await categoryModel.findById(categoryId);
    if (!category) return { data: "Kategori bulunamadı!", statusCode: 404 };

    const subcategories = await subcategoryModel.find({ categoryId });
    const subcategoryIds = subcategories.map(sub => sub._id);

    const productsInSubcategories = await productModel.find({ subcategoryId: { $in: subcategoryIds } });
    if (productsInSubcategories.length > 0) return { data: "Bağlı ürünler var, önce onları silmelisiniz!", statusCode: 400 };

    await subcategoryModel.deleteMany({ categoryId });
    const deletedCategory = await categoryModel.findByIdAndDelete(categoryId);
    if (!deletedCategory) return { data: "Kategori silinemedi!", statusCode: 500 };

    return { data: "Kategori ve boş alt kategoriler silindi!", statusCode: 200 };
  } catch (error) {
    console.error("Kategori silme hatası:", error);
    return { data: "Kategori silinirken hata oluştu!", statusCode: 500 };
  }
};

// List All Categories fonksiyonu
export const getAllCategories = async () => {
  try {
    const categories = await categoryModel.find().select("name description image -_id");
    if (!categories.length) return { data: "Henüz kategori eklenmemiş!", statusCode: 404 };
    return { data: categories, statusCode: 200 };
  } catch (error) {
    return { data: "Kategoriler getirilemedi!", statusCode: 500 };
  }
};
