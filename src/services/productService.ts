import mongoose, { ObjectId } from "mongoose";
import { IUser } from "../models/userModel";
import categoryModel from "../models/categoryModel";
import subcategoryModel from "../models/subcategoryModel";
import productModel from "../models/productModel";


interface CreateProductParams {
  user: IUser;
  title: string;
  description?: string;
  image: string;
  otherImages?: string[];
  SKU: string;
  categoryId: string;
  subcategoryId: string;
  priceTL: number;
  discountedPriceTL?: number | null;
  measureUnit: string;
  measureValue: number;
  stockCount: number;
  brand: string;
}

/**
 * Creates a new product in the database.
 * 
 * This function validates the input parameters, checks for existing products
 * with the same SKU, verifies the existence of the specified category and subcategory,
 * and ensures the user has admin privileges. It also performs checks on various fields
 * to ensure they have valid and non-negative values before creating a new product.
 * 
 * @param {IUser} user - The user creating the product, must have admin privileges.
 * @param {string} title - The title of the product.
 * @param {string} [description] - The description of the product.
 * @param {string} image - The main image URL for the product.
 * @param {string[]} [otherImages] - An array of additional image URLs for the product.
 * @param {string} SKU - The stock keeping unit, must be unique.
 * @param {string} categoryId - The ID of the category the product belongs to.
 * @param {string} subcategoryId - The ID of the subcategory the product belongs to.
 * @param {number} priceTL - The price of the product in TL, must be non-negative.
 * @param {number|null} [discountedPriceTL] - The discounted price in TL, if applicable.
 * @param {string} measureUnit - The unit of measurement for the product.
 * @param {number} measureValue - The value of the measurement unit, must be non-negative.
 * @param {number} stockCount - The number of items in stock, must be non-negative.
 * @param {string} brand - The brand of the product, which is formatted appropriately.
 * 
 * @returns {Promise<{ data: object|string, statusCode: number }>}
 * Returns a promise resolving to an object containing a data field with product details or an error message,
 * and a statusCode indicating the result of the operation.
 */

export const createProduct = async ({
  user, title, description = "", image, otherImages = [], SKU, categoryId, subcategoryId,
  priceTL, discountedPriceTL = null, measureUnit, measureValue, stockCount, brand
}: CreateProductParams) => {
  try {
    //  Eksik Alan Kontrolleri**
    if (!title || !image || !SKU || !categoryId || !subcategoryId ||
      priceTL === undefined || !measureUnit || measureValue === undefined ||
      stockCount === undefined || !brand) {
      return { data: "Lütfen tüm zorunlu alanları eksiksiz doldurun!", statusCode: 400 };
    }

    if (!mongoose.Types.ObjectId.isValid(categoryId.trim())) {
      return { data: "Geçersiz kategori ID! Lütfen doğru bir ID girin.", statusCode: 400 };
    }
    if (!mongoose.Types.ObjectId.isValid(subcategoryId.trim())) {
      return { data: "Geçersiz alt kategori ID! Lütfen doğru bir ID girin.", statusCode: 400 };
    }

    if (user.adminFlag !== true) {
      return { data: "Yetkisiz işlem! Sadece adminler ürün ekleyebilir.", statusCode: 403 };
    }

    //  Aynı SKU'ya Sahip Ürün Kontrolü**
    const findProduct = await productModel.findOne({ SKU: SKU.trim() });
    if (findProduct) {
      return { data: "Bu SKU koduna sahip bir ürün zaten mevcut!", statusCode: 400 };
    }

    //  Kategori ve Alt Kategori Kontrolleri**
    const findCategory = await categoryModel.findById(categoryId.trim());
    if (!findCategory) {
      return { data: "Kategori bulunamadı! Lütfen geçerli bir kategori seçin.", statusCode: 404 };
    }

    const findSubcategory = await subcategoryModel.findById(subcategoryId.trim());
    if (!findSubcategory) {
      return { data: "Alt kategori bulunamadı! Lütfen geçerli bir alt kategori seçin.", statusCode: 404 };
    }


    // Negatif değer kontrolü
    if (priceTL !== undefined && priceTL < 0) {
      return { data: "Fiyat 0 veya negatif olamaz!", statusCode: 400 };
    }
    if (discountedPriceTL !== null) {
      if (discountedPriceTL !== undefined && discountedPriceTL <= 0) {
        return { data: "İndirimli fiyat 0 veya  negatif olamaz!", statusCode: 400 };
      }
    }
    if (measureValue !== undefined && measureValue <= 0) {
      return { data: "Ölçü birimi 0 veya negatif olamaz!", statusCode: 400 };
    }
    if (stockCount !== undefined && stockCount <= 0) {
      return { data: "Stok 0 veya adedi negatif olamaz!", statusCode: 400 };
    }

    brand = brand.charAt(0).toLocaleUpperCase("tr") + brand.slice(1).toLocaleLowerCase("tr");
    brand = brand.trim();

    // **6. Yeni Ürünü Kaydet**
    const newProduct = new productModel({
      title: title.trim(),
      description: description.trim(),
      image: image.trim(),
      otherImages,
      SKU: SKU.trim(),
      categoryId: categoryId.trim(),
      subcategoryId: subcategoryId.trim(),
      priceTL,
      discountedPriceTL,
      measureUnit: measureUnit.trim(),
      measureValue,
      stockCount,
      createdBy: user._id,
      updatedBy: user._id,
      recentlyAddedFlag: true, // **Yeni ürünlerde recentlyAddedFlag true olacak**
      brand,
    });

    const savedProduct = await newProduct.save();

   const oldBrands = findSubcategory.brands instanceof Map ? Object.fromEntries(findSubcategory.brands) : {};

    // Get existing products array or initialize an empty one
    const existingProducts = (oldBrands[brand] as ObjectId[]) || [];

    // Add new product ID
    oldBrands[brand] = [...existingProducts, savedProduct._id as ObjectId];

    // Convert back to a Mongoose `Map`
    findSubcategory.brands = new Map(Object.entries(oldBrands));

    await findSubcategory.save();
   
    return {
      data: {
        title: savedProduct.title,
        description: savedProduct.description,
        image: savedProduct.image,
        priceTL: `${savedProduct.priceTL} TL`,
        discountedPriceTL: discountedPriceTL !== null ? `${savedProduct.discountedPriceTL} TL` : `No Discount!`,
        measureUnit: savedProduct.measureUnit,
        measureValue: savedProduct.measureValue,
        category: findCategory.name,
        subcategory: findSubcategory.name,
        creatorName: `${user.name} ${user.surname}`,
        brand: savedProduct.brand,
      },
      statusCode: 201,
    };
  } catch (error) {
    console.error("Ürün oluşturma hatası:", error);
    return { data: `Ürün oluşturulurken bir hata meydana geldi. Lütfen tekrar deneyin! Hata Mesajı: ${error}`, statusCode: 500 };
  }
};


/************************************************************************************* */
// update fonksiyon

interface UpdateProductParams {
  user: IUser;
  productId: string;
  title?: string;
  description?: string;
  image?: string;
  otherImages?: string[];
  priceTL?: number;
  discountedPriceTL?: number;
  measureUnit?: string;
  measureValue?: number;
  stockCount?: number;
  recentlyAddedFlag?: boolean;
  brand?: string;
}

/**
 * Updates a product based on the provided parameters. 
 * Only users with admin privileges can perform this operation.
 * 
 * @param {UpdateProductParams} params - Parameters containing product details to be updated.
 * @param {IUser} params.user - The user attempting to perform the update.
 * @param {string} params.productId - The ID of the product to be updated.
 * @param {string} [params.title] - New title for the product.
 * @param {string} [params.description] - New description for the product.
 * @param {string} [params.image] - New main image URL of the product.
 * @param {string[]} [params.otherImages] - New list of additional image URLs.
 * @param {number} [params.priceTL] - New price in TL.
 * @param {number} [params.discountedPriceTL] - New discounted price in TL.
 * @param {string} [params.measureUnit] - New measurement unit (e.g., kg, piece).
 * @param {number} [params.measureValue] - New measurement value.
 * @param {number} [params.stockCount] - New stock count.
 * @param {boolean} [params.recentlyAddedFlag] - Flag indicating if the product is recently added.
 * @param {string} [params.brand] - New brand name for the product.
 * 
 * @returns {Promise<{data: any, statusCode: number}>} - Returns updated product data and status code.
 * 
 * The function validates the product ID and checks for user privileges. 
 * If the product is found, it updates the product details and handles the brand updates 
 * in the associated subcategory. If the brand is changed, the old brand is removed 
 * if no other products are associated with it, and the new brand is added.
 * Returns a success status and updated data, or an error message and status code 
 * if an error occurs.
 */

export const updateProduct = async ({
  user, productId, title, description, measureUnit, measureValue, priceTL, discountedPriceTL, stockCount, image, otherImages, recentlyAddedFlag, brand,
}: UpdateProductParams) => {
  try {
    if (!mongoose.Types.ObjectId.isValid(productId.trim())) return { data: "Geçersiz Ürün ID!", statusCode: 400 };

    if (!productId) {
      return { statusCode: 400, data: { message: "Eksik ürün ID girildi!" } };
    }
    if (!user.adminFlag) return { data: "Yetkiniz yok!", statusCode: 403 };
    
    const oldProduct = await productModel.findById(productId.trim());
    if (!oldProduct) {
      return { statusCode: 404, data: { message: "Ürün bulunamadı" } };
    }

    // Güncellenecek veriyi hazırla
    const updatedData: Record<string, any> = {};
    if (title !== undefined) updatedData.title = title.trim();
    if (description !== undefined) updatedData.description = description.trim();
    if (measureUnit !== undefined) updatedData.measureUnit = measureUnit.trim();
    if (measureValue !== undefined) updatedData.measureValue = measureValue;
    if (priceTL !== undefined) updatedData.priceTL = priceTL;
    if (discountedPriceTL !== undefined) updatedData.discountedPriceTL = discountedPriceTL;
    if (stockCount !== undefined) updatedData.stockCount = stockCount;
    if (image !== undefined) updatedData.image = image.trim();
    if (otherImages !== undefined && Array.isArray(otherImages)) updatedData.otherImages = otherImages;
    if (recentlyAddedFlag !== undefined) updatedData.recentlyAddedFlag = recentlyAddedFlag;
    if (brand !== undefined) {
      brand = brand.charAt(0).toLocaleUpperCase("tr") + brand.slice(1).toLocaleLowerCase("tr");
      brand = brand.trim();
      updatedData.brand = brand;
    }

    // Ürünü Güncelle
    const updatedProduct = await productModel.findByIdAndUpdate(
      productId.trim(),
      { $set: updatedData },
      { new: true }
    );

    if (!updatedProduct) {
      return { statusCode: 400, data: { message: "Ürün güncellenemedi" } };
    }

    // 4. Alt Kategoride `brands` Güncelleme İşlemi
    if (brand !== undefined) {
      const findSubcategory = await subcategoryModel.findById(updatedProduct.subcategoryId);
      if (findSubcategory) {
        // Mevcut `brands` bilgisini al
        const oldBrands =
          findSubcategory.brands instanceof Map
            ? Object.fromEntries(findSubcategory.brands)
            : {};
        // 4.1 Eski Markayı Kaldır (Eğer eski marka varsa)
        if (oldProduct.brand && oldBrands[oldProduct.brand]) {
          oldBrands[oldProduct.brand] = oldBrands[oldProduct.brand].filter(
            (id: ObjectId) => id.toString() !== productId.trim()
          );

          // Eğer eski markaya ait hiç ürün kalmadıysa, markayı kaldır
          if (oldBrands[oldProduct.brand].length === 0) {
            delete oldBrands[oldProduct.brand];
          }
        }

        // 4.2 Yeni Markayı Ekle
        if (!oldBrands[brand]) {
          oldBrands[brand] = []; // Eğer yeni marka yoksa, oluştur
        }

        if (!oldBrands[brand].includes(oldProduct._id as ObjectId)) {
          oldBrands[brand].push(oldProduct._id as ObjectId); // Yeni ürünü ekle
        }

        // 4.3 Güncellenmiş `brands` bilgisini tekrar Map'e çevir ve kaydet
        findSubcategory.brands = new Map(Object.entries(oldBrands));
        await findSubcategory.save();
      }
    }

    // 5. Başarılı Yanıt Dön
    return {
      statusCode: 200,
      data: updatedData,
    };
  } catch (error) {
    console.error("Ürün güncelleme hatası:", error);
    return { statusCode: 500, data: `Ürün güncelleme sırasında hata oluştu! Hata Mesajı: ${error}`};
  }
};


/************************************************************************************* */

// delete fonksyon istediğimiz ürünü belirdiğimiz id'ye gore silmek istiyoruz
interface DeleteProductParams {
  user: IUser;
  productId: string;
}

/**
 * Deletes a product based on the provided product ID. 
 * Only users with admin privileges can perform this operation.
 * 
 * @param {DeleteProductParams} params - Parameters containing user and productId.
 * @param {IUser} params.user - The user attempting to perform the deletion.
 * @param {string} params.productId - The ID of the product to be deleted.
 * 
 * @returns {Promise<{data: string, statusCode: number}>} - Returns a message and status code.
 * 
 * The function checks for valid product ID and existence of the product.
 * If the product is found, it is deleted and the associated brand is updated 
 * in the subcategory. If there are no more products under the brand, the brand 
 * is removed from the subcategory.
 */
export const deleteProduct = async ({ user, productId }: DeleteProductParams) => {
  try {
    if (!user.adminFlag) return { data: "Yetkiniz yok!", statusCode: 403 };
    if (productId) {
      if (!mongoose.Types.ObjectId.isValid(productId.trim())) {
        return { data: " Geçersiz ürün ID!", statusCode: 400 };
      }

      const product = await productModel.findById(productId.trim());
      if (!product) {
        return { data: " Ürün bulunamadı!", statusCode: 404 };
      }

      const { subcategoryId, brand } = product;
      await productModel.findByIdAndDelete(productId.trim());

      // **Subcategory'den productId'yi kaldır ve eğer markada başka ürün yoksa markayı da kaldır**
      const findSubcategory = await subcategoryModel.findById(subcategoryId);
      if (findSubcategory) {
        const oldBrands = findSubcategory.brands instanceof Map ? Object.fromEntries(findSubcategory.brands) : {};
        // Eğer marka varsa ve içinde bu ürünü barındırıyorsa
        if (oldBrands[brand]) {
          // Ürünü listeden çıkar
          oldBrands[brand] = oldBrands[brand].filter((id: ObjectId) => id.toString() !== productId);

          // Eğer bu markaya ait hiç ürün kalmadıysa markayı tamamen sil
          if (oldBrands[brand].length === 0) {
            delete oldBrands[brand];
          }
        }

        // Güncellenmiş `brands` bilgisini tekrar Map'e çevir
        findSubcategory.brands = new Map(Object.entries(oldBrands));
        await findSubcategory.save();
      }
      return { data: "Ürün başarıyla silindi!", statusCode: 200 };
    } else {
      return { data: "Eksik ürün ID!", statusCode: 400 };
    }
  } catch (error) {
    console.error("Ürün silme hatası:", error);
    return { data: `Ürünler silinirken bir hata oluştu! Hata Mesajı: ${error}`, statusCode: 500 };
  }
};



/************************************************************************************* */

// list-all-by-category fonksyon 

export const getProductsByCategory = async (categoryId?: string) => {
  try {
    const filter = categoryId ? { categoryId: categoryId.trim() } : {}; // categoryId varsa filtre uygula, yoksa tüm ürünleri getir

    if (categoryId && !mongoose.Types.ObjectId.isValid(categoryId.trim())) {
      return { data: "Geçersiz categoryId!", statusCode: 400 };
    }

    const products = await productModel
      .find(filter)
      .populate("categoryId", "name") // Kategori adını getir
      .populate("subcategoryId", "name") // Alt kategori adını getir
      .select("title description image otherImages priceTL discountedPriceTL measureUnit measureValue stockCount brand recentlyAddedFlag categoryId subcategoryId -_id")
      .lean();

    // Veriyi düzenle
    products.forEach((product: any) => {
      product.categoryName = product.categoryId?.name || "Bilinmeyen Kategori"; // Yeni alan ekle
      delete product.categoryId;

      product.subcategoryName = product.subcategoryId?.name || "Bilinmeyen Alt Kategori"; // Yeni alan ekle
      delete product.subcategoryId;

      // `brand` zaten string olarak kaydedildiği için doğrudan kullan
      product.brand = product.brand || "Bilinmeyen Marka";
    });

    if (!products.length) {
      return {
        data: categoryId?.trim()
          ? "Bu kategoriye ait ürün bulunamadı!"
          : "Henüz ürün eklenmemiş!",
        statusCode: 404,
      };
    }

    return { data: products, statusCode: 200 };
  } catch (error) {
    return { data: `Ürünler getirilemedi! Hata Mesajı: ${error}`, statusCode: 500 };
  }
};

/************************************************************************************* */

// list-all-by-subcategory fonksyon 

export const getProductsBySubcategory = async (subcategoryId?: string) => {
  try {
    const filter = subcategoryId ? { subcategoryId: subcategoryId.trim() } : {}; // subcategoryId varsa filtre uygula, yoksa tüm ürünleri getir

    if (subcategoryId && !mongoose.Types.ObjectId.isValid(subcategoryId.trim())) {
      return { data: "Geçersiz subcategoryId!", statusCode: 400 };
    }

    const products = await productModel
      .find(filter)
      .populate("categoryId", "name") // Kategori adını getir
      .populate("subcategoryId", "name") // Alt kategori adını getir
      .select("title description image otherImages priceTL discountedPriceTL measureUnit measureValue stockCount brand recentlyAddedFlag categoryId subcategoryId -_id")
      .lean();

    // Veriyi düzenle
    products.forEach((product: any) => {
      product.categoryName = product.categoryId?.name || "Bilinmeyen Kategori";
      delete product.categoryId;

      product.subcategoryName = product.subcategoryId?.name || "Bilinmeyen Alt Kategori";
      delete product.subcategoryId;

      product.brand = product.brand || "Bilinmeyen Marka";
    });

    if (!products.length) {
      return {
        data: "Henüz ürün eklenmemiş!", statusCode: 404
      };
    }
    return { data: products, statusCode: 200 };
  } catch (error) {
    return { data: `Ürünler getirilemedi! Hata Mesajı: ${error}`, statusCode: 500 };
  }
};
