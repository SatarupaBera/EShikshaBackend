import mongoose from "mongoose";

const RevokedTokenSchema=new mongoose.Schema({
    jti:String,
    expiresAt:Date
})

export default mongoose.model('RevokedToken',RevokedTokenSchema);
