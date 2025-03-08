import express from "express";
import { createProduct, updateProduct } from "../services/productService";

const router = express.Router();

router.post("/create", async (req, res) => {
   try {
      const { title, description, image, otherImages, SKU, categoryId, subcategoryId, price, discountedPrice,
         measureUnit, measureValue, stockCount, createdBy, brand } = req.body;

      const { statusCode, data } = await createProduct({
         title, description, image, otherImages, SKU, categoryId, subcategoryId, price, discountedPrice,
         measureUnit, measureValue, stockCount, createdBy, brand
      });

      res.status(statusCode).send(data);
   } catch (error) {
      console.error("Ürün oluşturma hatası:", error);
      res.status(500).send("Bir hata oluştu!");
   }
});



router.post("/update", async (req, res) => {
   try {
      const { productId, updatedBy, title, description, SKU, categoryId, subcategoryId, measureUnit, measureValue, price, discountedPrice, stockCount, image, otherImages, recentlyAddedFlag } = req.body;

      const { statusCode, data } = await updateProduct({
         productId, updatedBy, title, description, SKU, categoryId, subcategoryId, measureUnit, measureValue, price, discountedPrice, stockCount, image, otherImages, recentlyAddedFlag
      });

      res.status(statusCode).send(data);
   } catch (error) {
      console.error("Ürün güncelleme hatası:", error);
      res.status(500).send("Something went wrong!");
   }
});

export default router;
