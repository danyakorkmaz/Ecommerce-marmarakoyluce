import express from "express";
import dotenv from "dotenv";
import mongoose from "mongoose";
import userRoute from "./routes/userRoute"
import categoryRoute from "./routes/categoryRoute"
import subcategoryRoute from "./routes/subcategoryRoute";
import updateRecentlyAddedFlag from "./cronJobs/updateRecentlyAdded"; 
import productRoute from "./routes/productRoute";
// import addressRoute from "./routes/addressRoute";
// import cartRoute from "./routes/cartRoute";


// import cors from "cors";

dotenv.config();

const app = express();
const port = 3002;

app.use(express.json());
// app.use(cors());

updateRecentlyAddedFlag();

mongoose
  //   .connect(process.env.DATABASE_URL || "")
  .connect("mongodb://localhost:27017/koyluce")
  .then(() => console.log("Mongo connected !"))
  .catch((err) => console.log("Failed to connect!", err));


app.use('/user', userRoute);
app.use('/category', categoryRoute);
app.use("/subcategories", subcategoryRoute);
app.use("/product", productRoute);
// app.use("/address", addressRoute);
// app.use('/cart', cartRoute);

app.listen(port, () => {
  console.log(`Server is running at :http://localhost:${port}`)
})