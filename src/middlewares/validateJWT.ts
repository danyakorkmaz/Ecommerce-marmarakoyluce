import {  Response, NextFunction } from "express"
import jwt from "jsonwebtoken";
import userModel from "../models/userModel";
import { ExtendRequest } from "../types/extendedRequest";



const validateJWT = (req: ExtendRequest, res: Response, next: NextFunction) => {
    const authorizationHeader = req.get('authorization'); //req.get yejleb ay şi mn alheader

    if (!authorizationHeader) {
        res.status(403).send("Authorization header was not provided");
        return;
    }

    const token = authorizationHeader.split(" ")[1];

    if (!token) {
        res.status(403).send("Bearer not found ");
        return;
    }

    jwt.verify(token, "fertaergrthyfjyyj" , async (err, payload) => {
        if (err) {
            res.status(403).send("Invalid token")
            return;
        }

        if (!payload) {//albayanat almuşaffara
            res.status(403).send("Invalid token payload")
            return;
        }

        const userPayload = payload as { email: string; firstName: string; lastName: string; };

        //fetch user from database baseed on the payload
        const user = await userModel.findOne({ email: userPayload.email });
        req.user = user;
        next();
    });
};

export default validateJWT