import express from "express";
import { createProduct, deleteProduct, getProductsByCategory, getProductsBySubcategory, updateProduct, } from "../services/productService";
import validateJWT from "../middlewares/validateJWT";
import { ExtendRequest } from "../types/extendedRequest";

const router = express.Router();

router.post("/create", validateJWT, async (req: ExtendRequest, res) => {
   try {
      const user = req?.user;
      const { title, description, image, otherImages, SKU, categoryId, subcategoryId, priceTL, discountedPriceTL,
         measureUnit, measureValue, stockCount, brand } = req.body;

      const { statusCode, data } = await createProduct({
         user, title, description, image, otherImages, SKU, categoryId, subcategoryId, priceTL, discountedPriceTL,
         measureUnit, measureValue, stockCount, brand
      });
      res.status(statusCode).send(data);
   } catch (error) {
      console.error("Ürün oluşturma hatası:", error);
      res.status(500).send("Bir hata oluştu!");
   }
});


router.post("/update", validateJWT, async (req: ExtendRequest, res) => {
   try {
      const user = req?.user;
      const { productId, title, description, measureUnit, measureValue, priceTL, discountedPriceTL, stockCount, image, otherImages, recentlyAddedFlag, brand } = req.body;
      const { statusCode, data } = await updateProduct({
         user, productId, title, description, measureUnit, measureValue, priceTL, discountedPriceTL, stockCount, image, otherImages, recentlyAddedFlag, brand
      });
      res.status(statusCode).send(data);
   } catch (error) {
      console.error("Ürün güncelleme hatası:", error);
      res.status(500).send("Something went wrong!");
   }
});


router.delete("/delete/:productId?", validateJWT, async (req: ExtendRequest, res) => {
   try {
      const user = req?.user;
      const { productId } = req.params;
      const { data, statusCode } = await deleteProduct({ user, productId }); // Silme fonksiyonunu çağır
      res.status(statusCode).send(data); // Yanıtı gönder
   } catch (error) {
      res.status(500).json({ message: "Ürün silinirken hata oluştu!" });
   }
});


router.get("/list-all/:categoryId?", async (req, res) => {
   try {
      const { categoryId } = req.params;

      // Tüm ürünleri veya belirli bir kategoriye ait ürünleri getiren fonksiyonu çağır
      const response = await getProductsByCategory(categoryId ? String(categoryId) : undefined);

      res.status(response.statusCode).json(response.data);
   } catch (error) {
      res.status(500).json({ message: "Ürünler getirilirken hata oluştu!" });
   }
});


router.get("/list-by-subcategory/:subcategoryId?", async (req, res) => {
   try {
      const { subcategoryId } = req.params;

      // Tüm ürünleri veya belirli bir alt kategoriye ait ürünleri getiren fonksiyonu çağır
      const response = await getProductsBySubcategory(subcategoryId ? String(subcategoryId) : undefined);

      res.status(response.statusCode).json(response.data);
   } catch (error) {
      res.status(500).json({ message: "Ürünler getirilirken hata oluştu!" });
   }
});

//TODO: Add product to favourite (Favourite products are stored in the user model)

//TODO: delete product from favourite

//TODO: list favourite products

export default router;


