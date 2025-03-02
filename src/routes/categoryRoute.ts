import express from "express";
import { createCategory, deleteCategory, getAllCategories, updateCategory } from "../services/categoryService";

const router = express.Router();

router.post("/create", async (req, res) => {
  try {
    const { name, description, image, createdBy } = req.body;
    const { statusCode, data } = await createCategory({ name, description, image, createdBy });
    res.status(statusCode).send(data);
  } catch {
    res.status(500).send("Something went wrong!");
  }
});

router.post("/update", async (req, res) => {
  try {
    const { categoryId, updatedBy, name, description, image } = req.body;
    const { statusCode, data } = await updateCategory({ categoryId, updatedBy, name, description, image });
    res.status(statusCode).send(data);
  } catch {
    res.status(500).send("Something went wrong!");
  }
});


router.delete("/delete/:categoryId", async (req, res) => {
  try {
    const { categoryId } = req.params;
    const { data, statusCode } = await deleteCategory({ categoryId }); // Silme fonksiyonunu çağır
    res.status(statusCode).send(data); // Yanıtı gönder
  } catch (error) {
    res.status(500).json({ message: "Kategori silinirken hata oluştu!" });
  }
});

router.get("/list-all", async (req, res) => {
  try {
    const { data, statusCode } = await getAllCategories();
    res.status(statusCode).json(data);
  } catch (error) {
    res.status(500).json({ message: "Kategoriler getirilirken hata oluştu!" });
  }
});

export default router;
