import mongoose from "mongoose";
import userModel, { IUser } from "../models/userModel";
import categoryModel from "../models/categoryModel";
import subcategoryModel from "../models/subcategoryModel";
import productModel from "../models/productModel";

interface CreateSubcategoryParams {
    user: IUser;
    name: string;
    description?: string;
    categoryId: string; // String olarak alınacak, ObjectId'ye çevrilecek
}

export const createSubcategory = async ({
    user,
    name,
    description,
    categoryId,
}: CreateSubcategoryParams) => {
    try {
        //  Eksik Alan Kontrolleri**
        if (!name || !categoryId ) {
            return { data: "Lütfen tüm zorunlu alanları eksiksiz doldurun!", statusCode: 400 };
        }
        if (!mongoose.Types.ObjectId.isValid(categoryId)) {
            return {
                data: "Geçersiz kategoriID . Lütfen Geçerli bir kategoriID yazınız! ",
                statusCode: 400,
            };
        }
     
        if (!user.adminFlag) return { data: "Yetkiniz yok!", statusCode: 403 };

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
            updatedBy: user._id,
            createdBy: user._id, 
        });
        const savedSubcategory = await newSubcategory.save();
    
        const responseData = {
            name: savedSubcategory.name,
            description: savedSubcategory.description,
            categoryName: findCategory.name, // Kategori adı
            brands: savedSubcategory.brands,
            creatorName: `${user.name} ${user.surname}`, // Kullanıcının adı eklendi
        }; 
        return { data: responseData, statusCode: 201 };
    } catch (error) {
        return { data: `Alt kategori oluşturulamadı! Hata Mesajı: ${error}`, statusCode: 500 };
    }
};
/************************************************************************************* */

//update subcategory fonksiyon

interface UpdateSubcategoryParams {
    user: IUser;
    subcategoryId: string;
    name?: string;
    description?: string;
    categoryId?: string;
}

export const updateSubcategory = async ({
    user,
    subcategoryId,
    name,
    description,
    categoryId,
}: UpdateSubcategoryParams) => {
    try {
        if (!subcategoryId ) {
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

        if (!user.adminFlag) {
            return {
                data: "Yetkiniz yok! Sadece adminler kategori ekleyebilir.",
                statusCode: 403,
            };
        }

        const updateFields: Partial<UpdateSubcategoryParams> = {};
        (updateFields as any).updatedBy = user._id

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

        return {
            data: {
                categoryName: category ? category.name : "Kategori bulunamadı",
                subcategoryName: updatedSubcategory.name,
                description: updatedSubcategory.description,
                updaterName: `${user.name} ${user.surname}`,

            },
            statusCode: 200,
        };
    } catch (error) {
        console.error("Güncelleme hatası:", error);
        return { data: `Alt kategori güncellenemedi! Hata Mesajı: ${error}`, statusCode: 500 };
    }
};
/************************************************************************************* */
interface DeleteSubcategoryParams {
    user: IUser;
    subcategoryId: string;
}

export const deleteSubcategory = async ({ user, subcategoryId }: DeleteSubcategoryParams) => {
    try {
        if (!user.adminFlag) return { data: "Yetkiniz yok!", statusCode: 403 };

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
        return { data: `Alt kategori silinirken bir hata oluştu! Hata Mesajı: ${error}`, statusCode: 500 };
    }
};

/************************************************************************************* */

export const getAllSubcategories = async (categoryId?: string) => {
    try {
        // categoryId varsa filtre uygula, yoksa tümünü getir
        const filter = categoryId ? { categoryId } : {}; 

        if (categoryId) {
            if (!mongoose.Types.ObjectId.isValid(categoryId)) {
                return { data: "Geçersiz categoryId!", statusCode: 400 };
            }

            const categoryObjectId = new mongoose.Types.ObjectId(categoryId);
            const findCategory = await categoryModel.findById(categoryObjectId);
            if (!findCategory) {
                return { data: "Belirtilen kategori bulunamadı!", statusCode: 404 };
            }
        }

        const subcategories = await subcategoryModel
            .find(filter)
            .populate("categoryId", "name") // Kategori adını getir
            .populate("createdBy", "name surname") // createdBy bilgisini alıp creatorName'e çevireceğiz
            .select("name brands categoryId -_id") // createdBy'yi sorgudan tamamen çıkar
            .lean();

        if (!subcategories.length) {
            if (categoryId) {
                return {
                    data: "Bu kategoriye ait alt kategori bulunamadı!",
                    statusCode: 404,
                };   
            } else {
                return {
                    data: "Alt kategori bulunamadı!",
                    statusCode: 404,
                };    
            }
        }

        // categoryId'yi category olarak yeniden adlandır, creatorName ekle
        subcategories.forEach((subcategory: any) => {
            if (subcategory.categoryId) {
                subcategory.category = subcategory.categoryId.name;
                delete subcategory.categoryId;
            }
            if (subcategory.createdBy) {
                subcategory.creatorName = `${subcategory.createdBy.name} ${subcategory.createdBy.surname}`;
                delete subcategory.createdBy; // createdBy bilgisini tamamen kaldır
            }
            subcategory.brands = Object.keys(subcategory.brands);
        });

        return { data: subcategories, statusCode: 200 };
    } catch (error) {
        return { data: `Alt kategoriler getirilemedi! Hata Mesajı: ${error}`, statusCode: 500 };
    }
};
