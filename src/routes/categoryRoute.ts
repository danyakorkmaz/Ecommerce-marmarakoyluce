import express from "express";
import { createCategory, deleteCategory, getAllCategories, updateCategory } from "../services/categoryService";
import validateJWT from "../middlewares/validateJWT";
import { ExtendRequest } from "../types/extendedRequest";

const router = express.Router();

router.post("/create", validateJWT, async (req: ExtendRequest, res) => {
  try {
    const user = req?.user;
    const { name, description, image } = req.body;
    const { statusCode, data } = await createCategory({ user, name, description, image });
    res.status(statusCode).send(data);
  } catch {
    res.status(500).send("Something went wrong!");
  }
});

router.post("/update", validateJWT, async (req: ExtendRequest, res) => {
  try {
    const user = req?.user;
    const { categoryId, name, description, image } = req.body;
    const { statusCode, data } = await updateCategory({ user, categoryId, name, description, image });
    res.status(statusCode).send(data);
  } catch {
    res.status(500).send("Something went wrong!");
  }
});


router.delete("/delete/:categoryId", validateJWT, async (req: ExtendRequest, res) => {
  try {
    const user = req?.user;
    const { categoryId } = req.params;
    const { data, statusCode } = await deleteCategory({ user, categoryId }); // Silme fonksiyonunu çağır
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
