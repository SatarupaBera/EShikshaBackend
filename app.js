import cors from 'cors';
import env from 'dotenv';
import express from 'express';
import { errorHandler } from './src/middleware/errorHandler.middleware.js';
import { protectedRequestHandler } from './src/middleware/protectedRequestHandler.middleware.js';
import adminRouter from './src/routes/admin.routes.js';
import authRouter from './src/routes/auth.routes.js';
import instructorRouter from './src/routes/instructor.routes.js';
import publicRouter from "./src/routes/public.routes.js";
import studentRouter from "./src/routes/student.routes.js";
import userRouter from './src/routes/user.routes.js';


env.config();

const app = express();

app.use(cors({
  origin: process.env.ORIGIN_URL || 'http://localhost:4200', // Your Angular URL
  exposedHeaders: ['Content-Disposition', 'Content-Type']
}));

// app configuration
app.use( express.json() );
app.use( express.urlencoded( { extended:true } ) );

// public api endpoints
app.use("/", publicRouter);
// user endpoints
app.use("/auth", authRouter);

// private api endpoints
// Admin endpoints
app.use("/admin", protectedRequestHandler(['admin']), adminRouter);
// Instructor
app.use("/instructor", protectedRequestHandler(['instructor']), instructorRouter);
// Student
app.use("/student", protectedRequestHandler(['student']), studentRouter);
// all user
app.use("/user", protectedRequestHandler(['admin','instructor','student']), userRouter);

// ErrorHandler Middleware
app.use( errorHandler );

export default app;