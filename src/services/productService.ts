import mongoose, { ObjectId } from "mongoose";
import userModel from "../models/userModel";
import categoryModel from "../models/categoryModel";
import subcategoryModel from "../models/subcategoryModel";
import productModel from "../models/productModel";


interface CreateProductParams {
  title: string;
  description: string;
  image: string;
  otherImages?: string[];
  SKU: string;
  categoryId: string;
  subcategoryId: string;
  price: number;
  discountedPrice?: number;
  measureUnit: string;
  measureValue: number;
  stockCount: number;
  createdBy: string;
  brand: string;
}

export const createProduct = async ({
  title, description, image, otherImages = [], SKU, categoryId, subcategoryId,
  price, discountedPrice = 0, measureUnit, measureValue, stockCount, createdBy, brand
}: CreateProductParams) => {
  try {
    //  Eksik Alan Kontrolleri**
    if (!title || !description || !image || !SKU || !categoryId || !subcategoryId ||
      price === undefined || measureUnit === undefined || measureValue === undefined ||
      stockCount === undefined || !createdBy || !brand) {
      return { data: "Lütfen tüm zorunlu alanları eksiksiz doldurun!", statusCode: 400 };
    }

    //  Geçersiz ID Kontrolleri**
    if (!mongoose.Types.ObjectId.isValid(createdBy)) {
      return { data: "Geçersiz kullanıcı ID! Lütfen geçerli bir ID girin.", statusCode: 400 };
    }
    const creatorObjectId = new mongoose.Types.ObjectId(createdBy);

    if (!mongoose.Types.ObjectId.isValid(categoryId)) {
      return { data: "Geçersiz kategori ID! Lütfen doğru bir ID girin.", statusCode: 400 };
    }
    if (!mongoose.Types.ObjectId.isValid(subcategoryId)) {
      return { data: "Geçersiz alt kategori ID! Lütfen doğru bir ID girin.", statusCode: 400 };
    }

    //  Kullanıcı Yetkisi Kontrolü**
    const findUser = await userModel.findById(creatorObjectId);
    if (!findUser) {
      return { data: "Kullanıcı bulunamadı! Lütfen geçerli bir kullanıcı ID girin.", statusCode: 404 };
    }
    if (findUser.adminFlag !== true) {
      return { data: "Yetkisiz işlem! Sadece adminler ürün ekleyebilir.", statusCode: 403 };
    }

    //  Aynı SKU'ya Sahip Ürün Kontrolü**
    const findProduct = await productModel.findOne({ SKU });
    if (findProduct) {
      return { data: "Bu SKU koduna sahip bir ürün zaten mevcut!", statusCode: 400 };
    }

    //  Kategori ve Alt Kategori Kontrolleri**
    const findCategory = await categoryModel.findById(categoryId);
    if (!findCategory) {
      return { data: "Kategori bulunamadı! Lütfen geçerli bir kategori seçin.", statusCode: 404 };
    }

    const findSubcategory = await subcategoryModel.findById(subcategoryId);
    if (!findSubcategory) {
      return { data: "Alt kategori bulunamadı! Lütfen geçerli bir alt kategori seçin.", statusCode: 404 };
    }


    // Negatif değer kontrolü
    if (price !== undefined && price < 0) {
      return { data: "Fiyat 0 veya negatif olamaz!", statusCode: 400 };
    }
    if (discountedPrice !== undefined && discountedPrice < 0) {
      return { data: "İndirimli fiyat 0 veya  negatif olamaz!", statusCode: 400 };
    }
    if (measureValue !== undefined && measureValue <= 0) {
      return { data: "Ölçü birimi 0 veya negatif olamaz!", statusCode: 400 };
    }
    if (stockCount !== undefined && stockCount <= 0) {
      return { data: "Stok 0 veya  adedi negatif olamaz!", statusCode: 400 };
    }

    brand = brand.charAt(0).toLocaleUpperCase("tr") + brand.slice(1).toLocaleLowerCase("tr");

    // **6. Yeni Ürünü Kaydet**
    const newProduct = new productModel({
      title,
      description,
      image,
      otherImages,
      SKU,
      categoryId,
      subcategoryId,
      price,
      discountedPrice,
      measureUnit,
      measureValue,
      stockCount,
      createdBy: creatorObjectId,
      updatedBy: creatorObjectId,
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
        id: savedProduct._id,
        title: savedProduct.title,
        description: savedProduct.description,
        image: savedProduct.image,
        price: `${savedProduct.price} TL`,
        discountedPrice: `${savedProduct.discountedPrice} TL`,
        measureUnit: savedProduct.measureUnit,
        measureValue: savedProduct.measureValue,
        category: findCategory.name,
        subcategory: findSubcategory.name,
        creatorName: `${findUser.name} ${findUser.surname}`,
        brand: brand,
      },
      statusCode: 201,
    };
  } catch (error) {
    console.error("Ürün oluşturma hatası:", error);
    return { data: "Ürün oluşturulurken bir hata meydana geldi. Lütfen tekrar deneyin!", statusCode: 500 };
  }
};


/************************************************************************************* */
// update fonksiyon
interface UpdateProductParams {
  productId: string;
  updatedBy: string;
  title?: string;
  description?: string;
  image?: string;
  otherImages?: string[];
  SKU?: string;
  categoryId?: string;
  subcategoryId?: string;
  price?: number;
  discountedPrice?: number;
  measureUnit?: string;
  measureValue?: number;
  stockCount?: number;
  recentlyAddedFlag?: boolean;
  brand?: string;
}

// export const updateProduct = async ({
//   productId,
//   updatedBy,
//   title,
//   description,
//   image,
//   otherImages = [],
//   SKU,
//   categoryId,
//   subcategoryId,
//   price,
//   discountedPrice = 0,
//   measureUnit,
//   measureValue,
//   stockCount,
//   recentlyAddedFlag,
//   brand,
//   ...extraFields // Parametreleri buraya ekle
// }: UpdateProductParams & { [key: string]: any }) => {
//   try {
//     // 1. Geçersiz Parametre Kontrolü
//     const allowedFields = [
//       "productId",
//       "updatedBy",
//       "title",
//       "description",
//       "image",
//       "otherImages",
//       "SKU",
//       "categoryId",
//       "subcategoryId",
//       "price",
//       "discountedPrice",
//       "measureUnit",
//       "measureValue",
//       "stockCount",
//       "recentlyAddedFlag",
//       "brand",
//     ];

//     // extraFields üzerinden gelen geçersiz alanları kontrol et
//     const invalidFields = Object.keys(extraFields).filter(field => !allowedFields.includes(field));

//     if (invalidFields.length > 0) {
//       return { data: `Geçersiz alanlar tespit edildi: ${invalidFields.join(", ")}`, statusCode: 400 };
//     }

//     // 2. Gerekli Parametre Kontrolleri
//     if (!productId || !updatedBy) {
//       return { data: "Ürün ID ve Güncelleyen Kullanıcı ID gereklidir!", statusCode: 400 };
//     }

//     // 2. Geçersiz ID Kontrolleri
//     if (!mongoose.Types.ObjectId.isValid(updatedBy)) {
//       return { data: "Geçersiz kullanıcı ID!", statusCode: 400 };
//     }
//     const updatedByObjectId = new mongoose.Types.ObjectId(updatedBy);

//     if (!mongoose.Types.ObjectId.isValid(productId)) {
//       return { data: "Geçersiz ürün ID!", statusCode: 400 };
//     }
// if (!name || !categoryId || !createdBy) {
//   return { data: "Lütfen tüm zorunlu alanları eksiksiz doldurun!", statusCode: 400 };
// }
//     // 3. Kullanıcı Yetkisi Kontrolü
//     const findUser = await userModel.findById(updatedByObjectId);
//     if (!findUser) {
//       return { data: "Kullanıcı bulunamadı!", statusCode: 404 };
//     }
//     if (!findUser.adminFlag) {
//       return { data: "Yetkisiz işlem! Sadece adminler ürün güncelleyebilir.", statusCode: 403 };
//     }

//     // 4. Ürün Bulma
//     const product = await productModel.findById(productId);
//     if (!product) {
//       return { data: "Ürün bulunamadı!", statusCode: 404 };
//     }

//     // 5. Kategori ve Alt Kategori Kontrolleri
//     if (categoryId) {
//       const findCategory = await categoryModel.findById(categoryId);
//       if (!findCategory) {
//         return { data: "Kategori bulunamadı!", statusCode: 404 };
//       }
//     }

//     if (subcategoryId) {
//       const findSubcategory = await subcategoryModel.findById(subcategoryId);
//       if (!findSubcategory) {
//         return { data: "Alt kategori bulunamadı!", statusCode: 404 };
//       }
//     }

//     // 6. Negatif Değer Kontrolü
//     if (price !== undefined && price < 0) {
//       return { data: "Fiyat negatif olamaz!", statusCode: 400 };
//     }
//     if (discountedPrice !== undefined && discountedPrice < 0) {
//       return { data: "İndirimli fiyat negatif olamaz!", statusCode: 400 };
//     }
//     if (measureValue !== undefined && measureValue <= 0) {
//       return { data: "Ölçü birimi 0 veya negatif olamaz!", statusCode: 400 };
//     }
//     if (stockCount !== undefined && stockCount < 0) {
//       return { data: "Stok 0 veya negatif olamaz!", statusCode: 400 };
//     }

//     const updatedData: Partial<UpdateProductParams> = {};

//     if (title !== undefined) updatedData.title = title;
//     if (description !== undefined) updatedData.description = description;
//     if (image !== undefined) updatedData.image = image;
//     if (otherImages !== undefined) updatedData.otherImages = otherImages;
//     if (SKU !== undefined) updatedData.SKU = SKU;
//     if (categoryId !== undefined) updatedData.categoryId = categoryId;
//     if (subcategoryId !== undefined) updatedData.subcategoryId = subcategoryId;
//     if (price !== undefined) updatedData.price = price;
//     if (discountedPrice !== undefined) updatedData.discountedPrice = discountedPrice;
//     if (measureUnit !== undefined) updatedData.measureUnit = measureUnit;
//     if (measureValue !== undefined) updatedData.measureValue = measureValue;
//     if (stockCount !== undefined) updatedData.stockCount = stockCount;
//     if (recentlyAddedFlag !== undefined) updatedData.recentlyAddedFlag = recentlyAddedFlag;
//     if (brand !== undefined) {
//       updatedData.brand = brand.charAt(0).toLocaleUpperCase("tr") + brand.slice(1).toLocaleLowerCase("tr");
//     }

//     // 8. Ürün Güncelleme
//     const updatedProduct = await productModel.findByIdAndUpdate(
//       productId,
//       {
//         ...updatedData,
//         updatedBy: updatedByObjectId,
//       },
//       { new: true }
//     );

//     if (!updatedProduct) {
//       return { data: "Ürün güncellenirken bir hata oluştu.", statusCode: 500 };
//     }
//     //const productData = product.toObject() as Partial<UpdateProductParams>;
//     const productData: Partial<UpdateProductParams> = {
//       productId: (updatedProduct._id as mongoose.Types.ObjectId).toString(),
//       title: updatedProduct.title,
//       description: updatedProduct.description,
//       image: updatedProduct.image,
//       otherImages: updatedProduct.otherImages,
//       SKU: updatedProduct.SKU,
//       categoryId: updatedProduct.categoryId?.toString(),
//       subcategoryId: updatedProduct.subcategoryId?.toString(),
//       price: updatedProduct.price,
//       discountedPrice: updatedProduct.discountedPrice,
//       measureUnit: updatedProduct.measureUnit,
//       measureValue: updatedProduct.measureValue,
//       stockCount: updatedProduct.stockCount,
//       recentlyAddedFlag: updatedProduct.recentlyAddedFlag,
//       brand: updatedProduct.brand,
//       updatedBy: updatedProduct.updatedBy.toString(),
//     };

//     // 9. Eğer hiçbir alan değişmemişse mesaj döndür
//     const isDataUnchanged = Object.keys(updatedData).every(
//       (key) => updatedData[key as keyof Partial<UpdateProductParams>] === productData[key as keyof Partial<UpdateProductParams>]
//     );

//     if (isDataUnchanged) {
//       return { data: "Güncellenen bir değişiklik yok!", statusCode: 200 };
//     }

//     return {
//       data: {
//         id: updatedProduct._id,
//         title: updatedProduct.title,
//         description: updatedProduct.description,
//         image: updatedProduct.image,
//         price: `${updatedProduct.price} TL`,
//         discountedPrice: `${updatedProduct.discountedPrice} TL`,
//         measureUnit: updatedProduct.measureUnit,
//         measureValue: updatedProduct.measureValue,
//         category: updatedProduct.categoryId,
//         subcategory: updatedProduct.subcategoryId,
//         creatorName: `${findUser.name} ${findUser.surname}`,
//         brand: updatedProduct.brand,
//       },
//       statusCode: 200,
//     };
//   } catch (error) {
//     console.error("Ürün güncelleme hatası:", error);
//     return { data: "Ürün güncellenirken bir hata meydana geldi!", statusCode: 500 };
//   }
// };


/************************************************************************************* */

// delete fonksyon istediğimiz ürünü belirdiğimiz id'ye gore silmek istiyoruz
interface DeleteProductParams {
  productId: string;
}

export const deleteProduct = async ({ productId }: { productId?: string }) => {
  try {
    if (productId) {
      // **Tek bir ürünü sil**
      if (!mongoose.Types.ObjectId.isValid(productId)) {
        return { data: " Geçersiz ürün ID!", statusCode: 400 };
      }

      const product = await productModel.findById(productId);
      if (!product) {
        return { data: " Ürün bulunamadı!", statusCode: 404 };
      }

      const { subcategoryId, brand } = product;

      await productModel.findByIdAndDelete(productId);

        // **Subcategory'den productId'yi kaldır ve eğer markada başka ürün yoksa markayı da kaldır**
        if (subcategoryId) {
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
      }
      return { data: " Ürün başarıyla silindi!", statusCode: 200 };
    }

    else {
      // **Tüm ürünleri sil**
      const deletedProducts = await productModel.deleteMany({});

      if (deletedProducts.deletedCount === 0) {
        return { data: " Silinecek ürün bulunamadı!", statusCode: 404 };
      }

      return {
        data: " Başarıyla işlem tamamlandı! ürün silindi.",
        statusCode: 200
      };
    }
  } catch (error) {
    console.error("Ürün silme hatası:", error);
    return { data: " Ürünler silinirken bir hata oluştu!", statusCode: 500 };
  }
};



/************************************************************************************* */

// list-all fonksyon 

export const getAllProducts = async (categoryId?: string) => {
  try {
    const filter = categoryId ? { categoryId } : {}; // categoryId varsa filtre uygula, yoksa tüm ürünleri getir

    if (categoryId && !mongoose.Types.ObjectId.isValid(categoryId)) {
      return { data: "Geçersiz categoryId!", statusCode: 400 };
    }

   
    const products = await productModel
      .find(filter)
      .populate("categoryId", "name") // Kategori adını getir
      .populate("subcategoryId", "name") // Alt kategori adını getir
      .populate("createdBy", "name surname") // Ürünü ekleyen kişiyi getir
      .select("title description image otherImages price measureUnit measureValue brand categoryId subcategoryId createdBy -_id")
      .lean();

    // Veriyi düzenle
    products.forEach((product: any) => {
      product.categoryName = product.categoryId?.name || "Bilinmeyen Kategori"; // Yeni alan ekle
  delete product.categoryId;

  product.subcategoryName = product.subcategoryId?.name || "Bilinmeyen Alt Kategori"; // Yeni alan ekle
  delete product.subcategoryId;

      // `brand` zaten string olarak kaydedildiği için doğrudan kullan
      product.brand = product.brand || "Bilinmeyen Marka";


      if (product.createdBy) {
        product.createdBy = `${product.createdBy.name} ${product.createdBy.surname}`;
      }
    });

    if (!products.length) {
      return {
        data: categoryId
          ? "Bu kategoriye ait ürün bulunamadı!"
          : "Henüz ürün eklenmemiş!",
        statusCode: 404,
      };
    }

    return { data: products, statusCode: 200 };
  } catch (error) {
    return { data: "Ürünler getirilemedi!", statusCode: 500 };
  }
};
