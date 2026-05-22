import express from 'express';
import { getUserSettings, updateUserSettings } from '../controller/user.controller.js';
import { logout } from '../controller/auth.controller.js';
import { getAllForums, postForum, postReply } from '../controller/forum.controller.js';

const router = express.Router();


router.route("/settings")
    .get( getUserSettings )
    .patch( updateUserSettings )

router.route("/logout")
    .post( logout )

router.route("/forum")
    .post(postForum)
    .get(getAllForums)
    .post(postReply)

export default router;