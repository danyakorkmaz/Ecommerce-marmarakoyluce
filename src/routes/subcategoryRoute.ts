import express from "express";
import { createSubcategory } from "../services/subcategoryService";

const router = express.Router();


router.post("/create", async (req, res) => {
  try {
    const { name, categoryId, description, brands, creator } = req.body;

    const { statusCode, data } = await createSubcategory({
      name,
      categoryId,
      description,
      brands,
      creator,
    });

    res.status(statusCode).send(data);
  } catch (error) {
    res.status(500).send({ error: "Bir hata oluştu!" });
  }
});

export default router;

