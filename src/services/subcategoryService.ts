import mongoose from "mongoose";
import userModel from "../models/userModel";
import categoryModel from "../models/categoryModel";
import subcategoryModel from "../models/subcategoryModel";
import productModel from "../models/productModel";

interface CreateSubcategoryParams {
    name: string;
    description?: string;
    categoryId: string; // String olarak alınacak, ObjectId'ye çevrilecek
    createdBy: string;
}
export const createSubcategory = async ({
    name,
    description,
    categoryId,
    createdBy,
}: CreateSubcategoryParams) => {
    try {
                //  Eksik Alan Kontrolleri**
    if (!name || !categoryId || !createdBy) {
        return { data: "Lütfen tüm zorunlu alanları eksiksiz doldurun!", statusCode: 400 };
      }
        if (!mongoose.Types.ObjectId.isValid(categoryId)) {
            return {
                data: "Geçersiz kategoriID . Lütfen Geçerli bir kategoriID yazınız! ",
                statusCode: 400,
            };
        }
        if (!mongoose.Types.ObjectId.isValid(createdBy)) {
            return {
                data: "Geçersiz creatorID. Lütfen geçerli bir creatorID yazınız!",
                statusCode: 400,
            };
        }

        // creator ID'sini ObjectId'ye çevir
        const creatorObjectId = new mongoose.Types.ObjectId(createdBy);

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

        //Yeni alt kategoriyi oluştur ve ilgili kategoriye ekle
        const newSubcategory = new subcategoryModel({
            name,
            description,
            categoryId: categoryObjectId,
            createdBy: creatorObjectId,
            updatedBy: creatorObjectId,
        });

        const savedSubcategory = await newSubcategory.save();


        const responseData = {
            name: savedSubcategory.name,
            description: savedSubcategory.description,
            categoryName: findCategory.name, // Kategori adı
            brands: savedSubcategory.brands,
            createdBy: {
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

interface UpdateSubcategoryParams {
    subcategoryId: string;
    updatedBy: string;
    name?: string;
    description?: string;
    categoryId?: string;
}

export const updateSubcategory = async ({
    subcategoryId,
    updatedBy,
    name,
    description,
    categoryId,
}: UpdateSubcategoryParams) => {
    try {
        if ( !subcategoryId || !updatedBy) {
            return { data: "Lütfen tüm zorunlu alanları eksiksiz doldurun!", statusCode: 400 };
          }
        if (!mongoose.Types.ObjectId.isValid(subcategoryId)) {
            return {
                data: "Geçersiz alt kategori ID. Lütfen geçerli bir ID yazınız!",
                statusCode: 400,
            };
        }

        const subcategory = await subcategoryModel.findById(subcategoryId);
        if (!subcategory) {
            return { data: "Alt kategori bulunamadı!", statusCode: 404 };
        }

        if (name && name !== subcategory.name) {
            const existingSubcategory = await subcategoryModel.findOne({ name });
            if (existingSubcategory) {
                return {
                    data: "Bu isimde başka bir alt kategori zaten var!",
                    statusCode: 400,
                };
            }
        }

        if (!mongoose.Types.ObjectId.isValid(updatedBy)) {
            return {
                data: "Updater ID girilmedi veya geçersiz Updater ID. Lütfen geçerli bir Updater ID yazınız!",
                statusCode: 400,
            };
        }

        // Kullanıcının var olup olmadığını kontrol et
        const findUser = await userModel.findById(updatedBy);

        if (!findUser) {
            return { data: "Kullanıcı bulunamadı!", statusCode: 404 };
        }

        if (!findUser.adminFlag) {
            return {
                data: "Yetkiniz yok! Sadece adminler kategori ekleyebilir.",
                statusCode: 403,
            };
        }

        const updateFields: Partial<UpdateSubcategoryParams> = {};
        updateFields.updatedBy = updatedBy;

        if (name && subcategory.name !== name) {
            updateFields.name = name;
        }
        if (description && subcategory.description !== description) {
            updateFields.description = description;
        }
        if (categoryId && subcategory.categoryId.toString() !== categoryId) {
            updateFields.categoryId = categoryId;
        }
        
        if (Object.keys(updateFields).length === 1) {
            return { data: " Alt kategorinin hiçbir verisinin güncellenmiş hali girilmedi!", statusCode: 400 };
        }
        const updatedSubcategory = await subcategoryModel
            .findByIdAndUpdate(subcategoryId, { $set: updateFields }, { new: true })
            .select("name description brands categoryId updatedBy");

        if (!updatedSubcategory) {
            return { data: "Alt kategori güncellenemedi!", statusCode: 500 };
        }

        // Kategori adını almak için categoryId'yi kullan
        const category = await categoryModel.findById(updatedSubcategory.categoryId).select("name");

        // Kullanıcı adını almak için creator ID'yi kullan
        const updater = await userModel.findById(updatedSubcategory.updatedBy).select("name surname");

        return {
            data: {
                categoryName: category ? category.name : "Kategori bulunamadı",
                subcategoryName: updatedSubcategory.name,
                description: updatedSubcategory.description,
                updaterName: updater ? `${updater.name} ${updater.surname}` : "Güncelleyen kişi bulunamadı",

            },
            statusCode: 200,
        };
    } catch (error) {
        console.error("Güncelleme hatası:", error);
        return { data: "Alt kategori güncellenemedi!", statusCode: 500 };
    }
};
/************************************************************************************* */
interface DeleteSubcategoryParams {
    subcategoryId: string;
}

export const deleteSubcategory = async ({ subcategoryId }: DeleteSubcategoryParams) => {
    try {
        // Geçerli bir ObjectId mi?**
        if (!mongoose.Types.ObjectId.isValid(subcategoryId)) {
            return { data: "Geçersiz alt kategori ID!", statusCode: 400 };
        }

        // Alt kategori var mı?**
        const subcategory = await subcategoryModel.findById(subcategoryId);
        if (!subcategory) {
            return { data: "Alt kategori bulunamadı!", statusCode: 404 };
        }

        // **Bu alt kategoriye bağlı ürün var mı?**
        const productsInSubcategory = await productModel.find({ subcategoryId });

        if (productsInSubcategory.length > 0) {
            return { data: "Bu alt kategoriye bağlı ürünler var, önce onları silmelisiniz!", statusCode: 400 };
        }

        // **Alt kategoriyi sil**
        const deletedSubcategory = await subcategoryModel.findByIdAndDelete(subcategoryId);

        if (!deletedSubcategory) {
            return { data: "Alt kategori silinemedi!", statusCode: 500 };
        }

        return { data: "Alt kategori başarıyla silindi!", statusCode: 200 };
    } catch (error) {
        console.error("Alt kategori silme hatası:", error);
        return { data: "Alt kategori silinirken bir hata oluştu!", statusCode: 500 };
    }
};

/************************************************************************************* */


//list all category fonksiyon
export const getAllSubcategories = async (categoryId?: string) => {
    try {
        const filter = categoryId ? { categoryId } : {}; // categoryId varsa filtre uygula, yoksa tümünü getir

        if (categoryId && !mongoose.Types.ObjectId.isValid(categoryId)) {
            return { data: "Geçersiz categoryId!", statusCode: 400 };
        }

        const subcategories = await subcategoryModel
            .find(filter)
            .populate("categoryId", "name") // Kategori adını getir
            .populate("createdBy", "name surname")
            .select("name brands createdBy categoryId -_id")
            .lean();

        // categoryId'yi category olarak yeniden adlandır
        subcategories.forEach((subcategory: any) => {
            if (subcategory.categoryId) {
                subcategory.category = subcategory.categoryId.name;
                delete subcategory.categoryId;
            }
            if (subcategory.createdBy) {
                subcategory.createdBy = `${subcategory.createdBy.name} ${subcategory.createdBy.surname}`;
            }
            subcategory.brands = Object.keys(subcategory.brands);
        });

        if (!subcategories.length) {
            return {
                data: categoryId
                    ? "Bu kategoriye ait alt kategori bulunamadı!"
                    : "Henüz alt kategori eklenmemiş!",
                statusCode: 404,
            };
        }

        return { data: subcategories, statusCode: 200 };
    } catch (error) {
        return { data: "Alt kategoriler getirilemedi!", statusCode: 500 };
    }
};




