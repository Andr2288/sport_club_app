// D:/RECOVER_DATA/Programming/React_Node.js/CHAT-APP/backend/src/routes\message.route.js

import express from "express";

import messageController from "../controllers/message.controller.js";
import authMiddleware from "../middleware/auth.middleware.js";

const router = express.Router();

router.get("/users", authMiddleware.protectRoute, messageController.getUsersForSideBar);

router.get("/:id", authMiddleware.protectRoute, messageController.getMessages);
router.post("/send/:id", authMiddleware.protectRoute, messageController.sendMessage);

export default router;