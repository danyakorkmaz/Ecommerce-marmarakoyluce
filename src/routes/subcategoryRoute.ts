import express from "express";
import { createSubcategory, deleteSubcategory,  getAllSubcategories,  updateSubcategory } from "../services/subcategoryService";
import validateJWT from "../middlewares/validateJWT";
import { ExtendRequest } from "../types/extendedRequest";

const router = express.Router();


router.post("/create", validateJWT, async (req: ExtendRequest, res) => {
  try {
    const user = req?.user;
    const { name, categoryId, description } = req.body;
    const { statusCode, data } = await createSubcategory({user, name, categoryId, description});
    res.status(statusCode).send(data);
  } catch (error) {
    res.status(500).send({ error: "Bir hata oluştu!" });
  }
});


router.post("/update", validateJWT, async (req: ExtendRequest, res) => {
  try {
    const user = req?.user;
    const { categoryId, name, description, subcategoryId } = req.body;
    const { statusCode, data } = await updateSubcategory({ user, categoryId, name, description,subcategoryId });
    res.status(statusCode).send(data);
  } catch {
    res.status(500).send("Something went wrong!");
  }
});


router.delete("/delete/:subcategoryId", validateJWT, async (req: ExtendRequest, res) => {
  try {
    const user = req?.user;
    const { subcategoryId } = req.params;
    const { data, statusCode } = await deleteSubcategory({ user, subcategoryId }); // Silme fonksiyonunu çağır
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
