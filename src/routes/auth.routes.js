import express from 'express';
import { authenticateUser, logout, registerUser } from '../controller/auth.controller.js';
import { registrationValidators } from '../validators/registration.validator.js';
import { protectedRequestHandler } from '../middleware/protectedRequestHandler.middleware.js';

const router = express.Router();
// authentication endpoints
router.post("/login", authenticateUser);
router.post("/register", registrationValidators, registerUser);
// router.get("/logout",protectedRequestHandler,)

export default router;