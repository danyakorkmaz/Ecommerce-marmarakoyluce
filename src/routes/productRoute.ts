import express from "express";
import { createProduct, deleteProduct, getAllProducts, } from "../services/productService";

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



// router.post("/update", async (req, res) => {
//    try {
//       const { productId, updatedBy, title, description, SKU, categoryId, subcategoryId, measureUnit, measureValue, price, discountedPrice, stockCount, image, otherImages, recentlyAddedFlag , brand} = req.body;

//       const { statusCode, data } = await updateProduct({
//          productId, updatedBy, title, description, SKU, categoryId, subcategoryId, measureUnit, measureValue, price, discountedPrice, stockCount, image, otherImages, recentlyAddedFlag, brand });

//       res.status(statusCode).send(data);
//    } catch (error) {
//       console.error("Ürün güncelleme hatası:", error);
//       res.status(500).send("Something went wrong!");
//    }
// });


 router.delete("/delete/:productId?", async (req, res) => {
   try {
     const { productId } = req.params;
     const { data, statusCode } = await deleteProduct({ productId }); // Silme fonksiyonunu çağır
     res.status(statusCode).send(data); // Yanıtı gönder
   } catch (error) {
     res.status(500).json({ message: "Kategori silinirken hata oluştu!" });
   }
 });


 router.get("/list-all/:categoryId?", async (req, res) => {
   try {
     const { categoryId } = req.params;
 
     // Tüm ürünleri veya belirli bir kategoriye ait ürünleri getiren fonksiyonu çağır
     const response = await getAllProducts(categoryId ? String(categoryId) : undefined);
 
     res.status(response.statusCode).json(response.data);
   } catch (error) {
     res.status(500).json({ message: "Ürünler getirilirken hata oluştu!" });
   }
 });
 
export default router;


