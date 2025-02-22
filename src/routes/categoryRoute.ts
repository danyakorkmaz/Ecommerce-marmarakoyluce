import express from "express";
import { createCategory } from "../services/categoryService";

const router = express.Router();

router.post("/create", async (req, res) => {
  try {
    const { name, description, image, creator } = req.body;
    const { statusCode, data } = await createCategory({
      name,
      description,
      image,
      creator,
    });
    res.status(statusCode).send(data);
  } catch {
    res.status(500).send("Something went wrong!");
  }
});


export default router;
