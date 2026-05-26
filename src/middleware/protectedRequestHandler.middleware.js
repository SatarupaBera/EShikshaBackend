import jwt from 'jsonwebtoken';
import { ErrorResponse } from '../util/ErrorResponse.js';
import Token from "../models/revokedToken.js";

export const protectedRequestHandler = (allwedRoles = []) => {
    return async (req, _, next) => {
        try {

            if (!req.headers.authorization) {
                throw "Invalid Token Format Or No token provided";
            }
            const token = req.headers.authorization.split(" ")[1];
            const result = jwt.verify(token, process.env.SECRET_KEY);

            if (!result.role) {
                throw new ErrorResponse(400, "user role not found")
            } else if (!result.JTI) {
                throw new ErrorResponse(400, "JTI not found")
            }
            req.jti = result.JTI;

            const isBackListed = await Token.findOne({ jti: result.JTI });

            if (isBackListed) {
                throw new ErrorResponse(400, "Token backlisted")
            }

            if (allwedRoles.includes(result.role.toLowerCase())) {
                req.user = { id: result._id }
 
                next();
            } else {
                throw "This url is restricted for you.";
            }
        } catch (err) {
            next(new ErrorResponse(401, err));
        }
    }
}