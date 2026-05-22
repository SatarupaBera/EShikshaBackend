import { validationResult } from "express-validator";
import UserModel from "../models/user.model.js";
import { AppResponse } from "../util/AppResponse.js";
import jwt from 'jsonwebtoken';
import {v4 as uuidv4} from "uuid";
import env from 'dotenv';
import { funcWrapper } from "../util/wraperFunction.js";
import Token from "../models/revokedToken.js";

env.config();

// Register User
export const registerUser = funcWrapper(async (req, res)=>{
    const errors = validationResult(req);
    if(!errors.isEmpty()){
        throw errors.array();
    }
    const user = await new UserModel(req.body).save();
    res.status(201).json(new AppResponse(user,"Registration Successful"));
})
 
// Authenticate User
export const authenticateUser = funcWrapper(async (req, res)=>{
    let user = await UserModel.findOne({email:req.body.email}).select("-createdAt -updatedAt -__v");
    if(!user){
        throw "Invalid Email Address";
    }
    if(user.isCorrectPassword(req.body.password)){

        const JTI = uuidv4();
        const payload = {_id:user._id, role:user.role, JTI}

        const token = jwt.sign(payload, process.env.SECRET_KEY, {expiresIn:'2d'});

        res.status(200).json(new AppResponse({token},"User LoggedIn"));
    }else{
        throw "Incorrect Password";
    }
})


export const logout=funcWrapper(async (req,res)=>{
    const jti=req.jti;

    await Token.create({jti});

    res.status(200).json(new AppResponse(Token,"User Logged out"));
}
)
