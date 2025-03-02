import express from "express";
import { createSubcategory, deleteSubcategory,  getAllSubcategories,  updateSubcategory } from "../services/subcategoryService";

const router = express.Router();


router.post("/create", async (req, res) => {
  try {
    const { name, categoryId, description, brands, createdBy } = req.body;
    const { statusCode, data } = await createSubcategory({ name, categoryId, description, brands, createdBy });
    res.status(statusCode).send(data);
  } catch (error) {
    res.status(500).send({ error: "Bir hata oluştu!" });
  }
});


router.post("/update", async (req, res) => {
  try {
    const { categoryId, updatedBy, name, description, subcategoryId, brands } = req.body;
    const { statusCode, data } = await updateSubcategory({ categoryId, updatedBy, name, description,subcategoryId,brands });
    res.status(statusCode).send(data);
  } catch {
    res.status(500).send("Something went wrong!");
  }
});


router.delete("/delete/:subcategoryId", async (req, res) => {
  try {
    const { subcategoryId } = req.params;
    const { data, statusCode } = await deleteSubcategory({ subcategoryId }); // Silme fonksiyonunu çağır
    res.status(statusCode).send(data); // Yanıtı gönder
  } catch (error) {
    res.status(500).json({ message: "Kategori silinirken hata oluştu!" });
  }
});

router.get("/list-all/:categoryId?", async (req, res) => {
    try {
      const { categoryId } = req.params; 
  
      // getAllSubcategories fonksiyonunu categoryId ile çağır
      const response = await getAllSubcategories(categoryId ? String(categoryId) : undefined);
  
      res.status(response.statusCode).json(response.data);
    } catch (error) {
      res.status(500).json({ message: "Alt kategoriler getirilirken hata oluştu!" });
    }
  });

export default router;

