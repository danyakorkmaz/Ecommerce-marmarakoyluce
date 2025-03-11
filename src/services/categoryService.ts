import mongoose, { ObjectId } from "mongoose";
import categoryModel from "../models/categoryModel";
import subcategoryModel from "../models/subcategoryModel";
import userModel from "../models/userModel"; // Kullanıcı modelini içe aktar
import productModel from "../models/productModel";

// Create Category fonksiyonu
interface CreateCategoryParams {
  name: string;
  description?: string;
  image: string;
  createdBy: string;
}

export const createCategory = async ({ name, description, image, createdBy }: CreateCategoryParams) => {
  try {

    if (!mongoose.Types.ObjectId.isValid(createdBy)) {
          return { data: "Geçersiz creator ID. Lütfen geçerli bir creator ID yazınız!", statusCode: 400 };
        }
             //  Eksik Alan Kontrolleri**
    if (!name ||  !image || !createdBy) {
      return { data: "Lütfen tüm zorunlu alanları eksiksiz doldurun!", statusCode: 400 };
    }

    const creatorObjectId = new mongoose.Types.ObjectId(createdBy);
    const findUser = await userModel.findById(creatorObjectId);

    if (!findUser) return { data: "Kullanıcı bulunamadı!", statusCode: 404 };
    if (!findUser.adminFlag) return { data: "Yetkiniz yok!", statusCode: 403 };
    
    const findCategory = await categoryModel.findOne({ name });
    if (findCategory) return { data: "Bu kategori zaten mevcut!", statusCode: 400 };

    const newCategory = new categoryModel({ name, description, image, createdBy: creatorObjectId, updatedBy: creatorObjectId });
    const savedCategory = await newCategory.save();

    return {
      data: {
        name: savedCategory.name,
        description: savedCategory.description,
        image: savedCategory.image,
        creatorName: `${findUser.name} ${findUser.surname}`,
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
  categoryId: string;
  updatedBy: string;
  name?: string;
  description?: string;
  image?: string;
}

export const updateCategory = async ({ categoryId, updatedBy, name, description, image }: UpdateCategoryParams) => {
  try {
    if (!mongoose.Types.ObjectId.isValid(categoryId)) return { data: "Geçersiz kategori ID!", statusCode: 400 };
    if (!mongoose.Types.ObjectId.isValid(updatedBy)) return { data: "Geçersiz Updater ID!", statusCode: 400 };


    if (!categoryId || !updatedBy ) {
      return { data: "Lütfen tüm zorunlu alanları eksiksiz doldurun!", statusCode: 400 };
    }

    const category = await categoryModel.findById(categoryId);
    if (!category) return { data: "Kategori bulunamadı!", statusCode: 404 };

    if (name && name !== category.name) {
      const existingCategory = await categoryModel.findOne({ name });
      if (existingCategory) return { data: "Bu isimde başka bir kategori var!", statusCode: 400 };
    }

    const findUser = await userModel.findById(updatedBy);
    if (!findUser) return { data: "Kullanıcı bulunamadı!", statusCode: 404 };
    if (!findUser.adminFlag) return { data: "Yetkiniz yok!", statusCode: 403 };

    const updateFields: Partial<UpdateCategoryParams> = { updatedBy };
    if (name && category.name !== name) updateFields.name = name;
    if (description && category.description !== description) updateFields.description = description;
    if (image && category.image !== image) updateFields.image = image;

    if (Object.keys(updateFields).length == 1) return { data: "Güncellenmiş veri girilmedi!", statusCode: 400 };

    const updatedCategory = await categoryModel.findByIdAndUpdate(categoryId, { $set: updateFields }, { new: true });
    if (!updatedCategory) return { data: "Kategori güncellenemedi!", statusCode: 500 };

    const updater = await userModel.findById(updatedCategory.updatedBy).select("name surname");
    return {
      data: {
        name: updatedCategory.name,
        description: updatedCategory.description,
        image: updatedCategory.image,
        updaterName: updater ? `${updater.name} ${updater.surname}` : "Bilinmeyen Kullanıcı",
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
  categoryId: string;
}

export const deleteCategory = async ({ categoryId }: DeleteCategoryParams) => {
  try {
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
