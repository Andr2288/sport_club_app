// src/lib/utils.js
import jwt from "jsonwebtoken";

const generateToken = (userId, res) => {
    const token = jwt.sign({ userId }, process.env.JWT_SECRET, {
        expiresIn: "7d",
    });

    res.cookie("jwt", token, {
        maxAge: 7 * 24 * 60 * 60 * 1000, // 7 днів
        httpOnly: true, // Запобігає XSS атакам
        sameSite: "strict", // Запобігає CSRF атакам
        secure: process.env.NODE_ENV !== "development", // HTTPS у продакшені
    });

    return token;
};

export default {
    generateToken,
};