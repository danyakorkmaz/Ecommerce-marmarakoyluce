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

        //Yeni alt kategoriyi oluştur ve ilgili kategoriye ekle
        const newSubcategory = new subcategoryModel({
            name,
            description,
            categoryId: categoryObjectId,
            brands,
            creator: creatorObjectId,
        });

        const savedSubcategory = await newSubcategory.save();


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

interface UpdateSubcategoryParams {
    subcategoryId: string;
    name?: string;
    description?: string;
    categoryId?: string;
    brands?: string[];
}

export const updateSubcategory = async ({
    subcategoryId,
    name,
    description,
    categoryId,
    brands,
}: UpdateSubcategoryParams) => {
    try {
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

        const updateFields: Partial<UpdateSubcategoryParams> = {};
        if (name) updateFields.name = name;
        if (description) updateFields.description = description;
        if (categoryId) updateFields.categoryId = categoryId;
        if (brands) updateFields.brands = brands;

        const updatedSubcategory = await subcategoryModel
            .findByIdAndUpdate(subcategoryId, { $set: updateFields }, { new: true })
            .select("name description brands categoryId creator");

        if (!updatedSubcategory) {
            return { data: "Alt kategori güncellenemedi!", statusCode: 500 };
        }

        // Kategori adını almak için categoryId'yi kullan
        const category = await categoryModel.findById(updatedSubcategory.categoryId).select("name");

        // Kullanıcı adını almak için creator ID'yi kullan
        const creator = await userModel.findById(updatedSubcategory.creator).select("name surname");

        return {
            data: {
                categoryName: category ? category.name : "Kategori bulunamadı",
                subcategoryName: updatedSubcategory.name,
                description: updatedSubcategory.description,
                brands: updatedSubcategory.brands,
                creatorName: creator ? `${creator.name} ${creator.surname}` : "Oluşturan kişi bulunamadı",
            },
            statusCode: 200,
        };
    } catch (error) {
        console.error("Güncelleme hatası:", error);
        return { data: "Alt kategori güncellenemedi!", statusCode: 500 };
    }
};
/************************************************************************************* */

//delete subcategory fonksiyon
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

        // Alt kategoriyi sil**
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
            .populate("creator", "name surname")
            .select("name brands creator categoryId -_id")
            .lean();

        // categoryId'yi category olarak yeniden adlandır
        subcategories.forEach((subcategory: any) => {
            if (subcategory.categoryId) {
                subcategory.category = subcategory.categoryId.name;
                delete subcategory.categoryId;
            }
            if (subcategory.creator) {
                subcategory.creator = `${subcategory.creator.name} ${subcategory.creator.surname}`;
            }
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




