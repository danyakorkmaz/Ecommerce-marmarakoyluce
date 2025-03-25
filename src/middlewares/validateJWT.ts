import { Response, NextFunction } from "express";
import jwt from "jsonwebtoken";
import userModel from "../models/userModel";
import { ExtendRequest } from "../types/extendedRequest";

const validateJWT = (req: ExtendRequest, res: Response, next: NextFunction): void => {
    try {
        const authorizationHeader = req.get("authorization");

        if (!authorizationHeader) {
            res.status(403).send("Authorization header was not provided");
            return;
        }

        const token = authorizationHeader.split(" ")[1];

        if (!token) {
            res.status(403).send("Bearer token not found");
            return;
        }

        jwt.verify(token, process.env.JWT_SECRET || "", async (err, payload) => {
            if (err) {
                res.status(403).send("Invalid token");
                return;
            }

            if (!payload) {
                res.status(403).send("Invalid token payload");
                return;
            }

            const userPayload = payload as { email: string; firstName: string; lastName: string };

            const user = await userModel.findOne({ email: userPayload.email });

            if (!user) {
                res.status(404).send("User not found");
                return;
            }

            req.user = user;
            next();
        });
    } catch (error) {
        console.error("JWT validation error:", error);
        res.status(500).send(`Internal Server Error: ${error}`);
    }
};

export default validateJWT;
