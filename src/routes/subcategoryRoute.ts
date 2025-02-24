import express from "express";
import { createSubcategory, updateSubcategory } from "../services/subcategoryService";

const router = express.Router();


router.post("/create", async (req, res) => {
  try {
    const { name, categoryId, description, brands, creator } = req.body;
    const { statusCode, data } = await createSubcategory({ name, categoryId, description, brands, creator });
    res.status(statusCode).send(data);
  } catch (error) {
    res.status(500).send({ error: "Bir hata oluştu!" });
  }
});




router.post("/update", async (req, res) => {
  try {
    const { categoryId, name, description, subcategoryId,brands } = req.body;
    const { statusCode, data } = await updateSubcategory({ categoryId, name, description,subcategoryId,brands });
    res.status(statusCode).send(data);
  } catch {
    res.status(500).send("Something went wrong!");
  }
});

export default router;

