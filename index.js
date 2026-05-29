import app from "./app.js";
import env from 'dotenv';
import { connectDatabase } from "./src/config/db.config.js";
env.config();

const PORT = parseInt(process.env.PORT);
const HOST = process.env.HOST;
const PROTOCOL = process.env.PROTOCOL;


connectDatabase(process.env.MONGO_URI)
.then(()=>{
    app.listen(PORT, HOST, ()=>{
        console.log(`Server running on : ${PROTOCOL}://${HOST}:${PORT}`)
    })
})
.catch((err)=>{
    throw new Error(`Server error : ${err}`)
})

