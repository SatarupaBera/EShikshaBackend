import express from 'express';
import { getUserSettings, updateUserSettings } from '../controller/user.controller.js';
import { logout } from '../controller/auth.controller.js';
import { getChatResponse } from '../controller/chatbot.controller.js';

const router = express.Router();


router.route("/settings")
    .get( getUserSettings )
    .patch( updateUserSettings )

router.route("/logout")
    .post( logout )

router.route("/chat")
    .post( getChatResponse )


export default router;