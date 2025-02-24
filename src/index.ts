// /
import express from "express";
import { connect } from 'mongoose';
import mongoose from "mongoose";
import userRoute from "./routes/userRoute";
import { seedIntitialProducts } from "./services/productService";
import productRoute from "./routes/productRoute";
import categoryRoute from "./routes/categoryRoute"
import cartRoute from "./routes/cartRoute";
import subcategoryRoute from "./routes/subcategoryRoute";

// import cors from "cors";

// dotenv.config();

const app = express();
const port = 3002;

app.use(express.json());
// app.use(cors());

mongoose
//   .connect(process.env.DATABASE_URL || "")
.connect("mongodb://localhost:27017/koyluce")
  .then(() => console.log("Mongo connected !"))
  .catch((err) => console.log("Failed to connect!", err));

//seed the products to database
seedIntitialProducts();

 app.use('/user', userRoute);
 app.use('/category', categoryRoute);
app.use('/product', productRoute);
app.use('/cart', cartRoute);
app.use("/subcategories", subcategoryRoute);


  app.listen(port, () => {
   console.log(`Server is running at :http://localhost:${port}`)
  })