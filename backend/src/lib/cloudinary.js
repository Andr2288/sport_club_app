// D:/RECOVER_DATA/Programming/React_Node.js/CHAT-APP/backend/src/lib\cloudinary.js

import {v2 as cloudinary} from "cloudinary"
import {config} from "dotenv"

config()

cloudinary.config({
    cloud_name: process.env.СLOUDINARY_CLOUD_NAME,
    api_key: process.env.СLOUDINARY_API_KEY,
    api_secret: process.env.СLOUDINARY_API_SECRET
})

export default cloudinary;