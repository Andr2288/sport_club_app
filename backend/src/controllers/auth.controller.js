// src/controllers/auth.controller.js

import bcrypt from "bcryptjs";
import utils from "../lib/utils.js";
import User from "../models/user.model.js";
import cloudinary from "../lib/cloudinary.js";

const signup = async (req, res) => {
    const { fullName, email, password } = req.body;

    if (!fullName || !email || !password) {
        return res.status(400).json({message: "All fields are required"});
    }

    try {
        if (password.length < 6) {
            return res.status(400).json({message: `Password must be at least 6 characters`});
        }

        const existingUser = await User.findByEmail(email);
        if (existingUser) {
            return res.status(400).json({message: `Email already exists`});
        }

        const salt = await bcrypt.genSalt(10);
        const hashedPassword = await bcrypt.hash(password, salt);

        const newUser = await User.create({
            fullName,
            email,
            password: hashedPassword
        });

        if (newUser) {
            utils.generateToken(newUser.id, res);

            return res.status(201).json({
                id: newUser.id,
                fullName: newUser.fullName,
                email: newUser.email,
                profilePic: newUser.profilePic,
            });
        }
        else {
            return res.status(400).json({message: `Invalid user data`});
        }

    } catch (error) {
        console.log("Error in signup controller", error.message);
        return res.status(500).json({message: `Internal Server Error`});
    }
}

const login = async (req, res) => {
    const { email, password } = req.body;

    try {
        const user = await User.findByEmail(email);

        if (!user) {
            return res.status(400).json({message: "Invalid credentials"});
        }

        const isPasswordCorrect = await bcrypt.compare(password, user.password);

        if (!isPasswordCorrect) {
            return res.status(400).json({message: "Invalid credentials"});
        }

        utils.generateToken(user.id, res);

        return res.status(200).json({
            id: user.id,
            fullName: user.full_name,
            email: user.email,
            profilePic: user.profile_pic
        });

    } catch (error) {
        console.log("Error in login controller", error.message);
        return res.status(500).json({message: `Internal Server Error`});
    }
}

const logout = (req, res) => {
    try {
        res.cookie("jwt", "", {maxAge:0});

        return res.status(200).json({message: "Logged out"});

    } catch (error) {
        console.log("Error logged out", error.message);
        return res.status(500).json({message: `Internal Server Error`});
    }
}

const updateProfile = async (req, res) => {
    try {
        const { profilePic } = req.body;
        const userId = req.user.id;

        if (!profilePic) {
            return res.status(400).json({message: "ProfilePic is required"});
        }

        const uploadResponse = await cloudinary.uploader.upload(profilePic);

        const updatedUser = await User.updateById(userId, {
            profilePic: uploadResponse.secure_url
        });

        return res.status(200).json(updatedUser);

    } catch (error) {
        console.log("Error in update controller", error.message);
        return res.status(500).json({message: `Internal Server Error`});
    }
}

const checkAuth = (req, res) => {
    try {
        return res.status(200).json(req.user);
    }
    catch (error) {
        console.log("Error in check auth controller", error.message);
        return res.status(500).json({message: `Internal Server Error`});
    }
}

export default {
    signup,
    login,
    logout,
    updateProfile,
    checkAuth
};