import mongoose from "mongoose";

export const connectDatabase = (connectionUrl)=>mongoose.connect(connectionUrl)
.then(()=>console.log("Database connected!!!"))
.catch(()=>{
    throw new Error("Database connection error");
})