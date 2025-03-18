import express from "express";
import { getActiveCartForUser , addItemToCart, updateItemInCart, deleteItemInCart, clearCart , checkout} from "../services/cartService";
import validateJWT from "../middlewares/validateJWT";
import { ExtendRequest } from "../types/extendedRequest";

const router = express.Router();

router.get('/', validateJWT, async (req: ExtendRequest, res) => {
try {
        const userID = req?.user?._id;
        //get ActiveCartForUser
        //get the userId from the jwt , after validiting from middleware.
        const cart = await getActiveCartForUser({ userID });
        res.status(200).send(cart);
    } catch (err) {
        res.status(500).send("Something went wrong!")
    }
});


router.post('/items', validateJWT, async (req: ExtendRequest, res) => {
    try {
        const userID = req?.user?._id;
        const { productID, quantity } = req.body; //İstek gövdesinden (body) gelen veriler.
        const response = await addItemToCart({ userID, productID, quantity })
        res.status(response.statusCode).send(response.data);
    } catch {
        res.status(500).send("Something went wrong!");
    }
});


router.put("/items", validateJWT, async (req: ExtendRequest, res) => {
    try {
        const userID = req?.user?._id;
        const { productID, quantity } = req.body;
        const response = await updateItemInCart({ userID, productID, quantity });
        res.status(response.statusCode).send(response.data);
    } catch {
        res.status(500).send("Something went wrong!");
    }
})


router.delete("/items/:productID", validateJWT, async (req: ExtendRequest, res) => {
    try {
        const userID = req?.user?._id;
        const { productID } = req.params; //URL'den gelen parametreler.
        const response = await deleteItemInCart({ userID, productID });
        res.status(response.statusCode).send(response.data);
    } catch {
        res.status(500).send("Something went wrong!");
    }
});


router.delete("/", validateJWT, async (req: ExtendRequest, res) => {
    try {
        const userID = req?.user?._id;
        const response = await clearCart({ userID});
        res.status(response.statusCode).send(response.data);
    } catch {
        res.status(500).send("Something went wrong!");
    }
});

router.post("/checkout", validateJWT, async (req: ExtendRequest, res) => {
    try {
        const userID = req?.user?._id;
        const { addressID } = req.body;
        const response = await checkout({ userID, addressID });
        res.status(response.statusCode).send(response.data);
    } catch {
        res.status(500).send("Something went wrong!");
    }
});

export default router;