// src/controllers/message.controller.js

import User from "../models/user.model.js";
import Message from "../models/message.model.js";
import cloudinary from "../lib/cloudinary.js";

const getUsersForSideBar = async (req, res) => {
    try {
        const loggedInUserId = req.user.id;

        const filteredUsers = await User.findAll(loggedInUserId);

        return res.status(200).json(filteredUsers);
    }
    catch (error) {
        console.log("Error in getUsersForSideBar", error.message);
        return res.status(500).json({ message: "Internal Server Error" });
    }
}

const getMessages = async (req, res) => {
    try {
        const { id: userToChatId } = req.params;
        const myId = req.user.id;

        const messages = await Message.findByUsers(myId, userToChatId);

        return res.status(200).json(messages);
    }
    catch (error) {
        console.log("Error in getMessages", error.message);
        return res.status(500).json({ message: "Internal Server Error" });
    }
}

const sendMessage = async (req, res) => {
    try {
        const { text, image} = req.body;
        const { id: receiverId } = req.params;
        const senderId = req.user.id;

        let imageUrl = null;

        if (image) {
            const uploadResponse = await cloudinary.uploader.upload(image);
            imageUrl = uploadResponse.secure_url;
        }

        const newMessage = await Message.create({
            senderId,
            receiverId,
            text,
            image: imageUrl,
        });

        res.status(201).json(newMessage);
    }
    catch (error) {
        console.log("Error in sendMessage", error.message);
        return res.status(500).json({ message: "Internal Server Error" });
    }
}

export default {
    getUsersForSideBar,
    getMessages,
    sendMessage
}