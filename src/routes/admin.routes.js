import express from 'express';
import { addInstructor, getAllUser, getDashboard, removeUser, updateUser } from '../controller/admin.controller.js';

const router = express.Router();
// admin endpoints
router.route("/dashboard")
    .get( getDashboard )

router.get("/users", getAllUser);

router.route("/user/:userId")
    .patch( updateUser )
    .delete( removeUser )

router.route("/user")
    .post( addInstructor )

export default router;