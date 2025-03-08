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
}

export const updateProduct = async ({
  productId,
  updatedBy,
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
  recentlyAddedFlag,
}: UpdateProductParams) => {
  try {
    if (!mongoose.Types.ObjectId.isValid(productId)) {
      return { data: "Geçersiz ürün ID!", statusCode: 400 };
    }

    // Ürünü bul
    const product = await productModel.findById(productId);
    if (!product) {
      return { data: "Ürün bulunamadı!", statusCode: 404 };
    }

    if (!mongoose.Types.ObjectId.isValid(updatedBy)) {
      return { data: "Geçersiz kullanıcı ID!", statusCode: 400 };
    }

    // Kullanıcı kontrolü
    const findUser = await userModel.findById(updatedBy);
    if (!findUser) {
      return { data: "Kullanıcı bulunamadı!", statusCode: 404 };
    }
    if (!findUser.adminFlag) {
      return { data: "Yetkiniz yok! Sadece adminler ürün güncelleyebilir.", statusCode: 403 };
    }

    // SKU kontrolü (değiştirildiyse)
    if (SKU && SKU !== product.SKU) {
      const existingProduct = await productModel.findOne({ SKU });
      if (existingProduct) {
        return { data: "Bu SKU zaten başka bir ürüne ait!", statusCode: 400 };
      }
    }

    // Kategori ve alt kategori kontrolü
    if (categoryId && !mongoose.Types.ObjectId.isValid(categoryId)) {
      return { data: "Geçersiz kategori ID!", statusCode: 400 };
    }
    if (subcategoryId && !mongoose.Types.ObjectId.isValid(subcategoryId)) {
      return { data: "Geçersiz alt kategori ID!", statusCode: 400 };
    }

    if (categoryId) {
      const findCategory = await categoryModel.findById(categoryId);
      if (!findCategory) {
        return { data: "Kategori bulunamadı!", statusCode: 404 };
      }
    }

    if (subcategoryId) {
      const findSubcategory = await subcategoryModel.findById(subcategoryId);
      if (!findSubcategory) {
        return { data: "Alt kategori bulunamadı!", statusCode: 404 };
      }
    }

    // Negatif değer kontrolü
    if (price !== undefined && price < 0) {
      return { data: "Fiyat negatif olamaz!", statusCode: 400 };
    }
    if (discountedPrice !== undefined && discountedPrice < 0) {
      return { data: "İndirimli fiyat negatif olamaz!", statusCode: 400 };
    }
    if (measureValue !== undefined && measureValue <= 0) {
      return { data: "Ölçü birimi 0 veya negatif olamaz!", statusCode: 400 };
    }
    if (stockCount !== undefined && stockCount < 0) {
      return { data: "Stok adedi negatif olamaz!", statusCode: 400 };
    }

    // Güncellenecek alanları belirle
    const updateFields: Partial<UpdateProductParams> = {};
    updateFields.updatedBy = updatedBy;

    if (title && product.title !== title) updateFields.title = title;
    if (description && product.description !== description) updateFields.description = description;
    if (image && product.image !== image) updateFields.image = image;
    if (otherImages && JSON.stringify(product.otherImages) !== JSON.stringify(otherImages)) updateFields.otherImages = otherImages;
    if (SKU && product.SKU !== SKU) updateFields.SKU = SKU;
    if (categoryId && product.categoryId !== categoryId) updateFields.categoryId = categoryId;
    if (subcategoryId && product.subcategoryId !== subcategoryId) updateFields.subcategoryId = subcategoryId;
    if (price !== undefined && product.price !== price) updateFields.price = price;
    if (discountedPrice !== undefined && product.discountedPrice !== discountedPrice) updateFields.discountedPrice = discountedPrice;
    if (measureUnit && product.measureUnit !== measureUnit) updateFields.measureUnit = measureUnit;
    if (measureValue !== undefined && product.measureValue !== measureValue) updateFields.measureValue = measureValue;
    if (stockCount !== undefined && product.stockCount !== stockCount) updateFields.stockCount = stockCount;

    // // `recentlyAddedFlag` Güncelleme Mekanizması
    // const SEVEN_DAYS = 7 * 24 * 60 * 60 * 1000; // 7 gün
    // const isNew = Date.now() - new Date(product.createDate).getTime() < SEVEN_DAYS;

    // if (recentlyAddedFlag !== undefined) {
    //   updateFields.recentlyAddedFlag = recentlyAddedFlag; // Manuel ayarlama
    // } else {
    //   updateFields.recentlyAddedFlag = isNew; // Otomatik belirleme
    // }

    if (Object.keys(updateFields).length === 1) {
      return { data: "Ürünün hiçbir verisi değişmedi!", statusCode: 400 };
    }

    // Ürünü güncelle
    const updatedProduct = await productModel.findByIdAndUpdate(
      productId,
      { $set: updateFields },
      { new: true }
    );

    if (!updatedProduct) {
      return { data: "Ürün güncellenemedi!", statusCode: 500 };
    }

    // Güncellemeyi yapan kişinin bilgilerini al
    const updater = await userModel.findById(updatedProduct.updatedBy).select("name surname");

    return {
      data: {
        title: updatedProduct.title,
        description: updatedProduct.description,
        image: updatedProduct.image,
        otherImages: updatedProduct.otherImages,
        SKU: updatedProduct.SKU,
        categoryId: updatedProduct.categoryId,
        subcategoryId: updatedProduct.subcategoryId,
        price: updatedProduct.price,
        discountedPrice: updatedProduct.discountedPrice,
        measureUnit: updatedProduct.measureUnit,
        measureValue: updatedProduct.measureValue,
        stockCount: updatedProduct.stockCount,
        recentlyAddedFlag: updatedProduct.recentlyAddedFlag,
        updaterName: updater ? `${updater.name} ${updater.surname}` : "Bilinmeyen Kullanıcı",
      },
      statusCode: 200,
    };
  } catch (error) {
    console.error("Ürün güncelleme hatası:", error);
    return { data: "Ürün güncellenemedi!", statusCode: 500 };
  }
};


/************************************************************************************* */
// delete fonksyon
