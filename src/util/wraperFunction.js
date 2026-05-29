import { ErrorResponse } from "./ErrorResponse.js";

export const funcWrapper = (func) => async (req, res, next)=>{
    try{
        await func(req, res);
    }catch(err){
        if(err instanceof ErrorResponse){
            return next(err);
        }
        next(new ErrorResponse(400, err.message||err));
    }
}