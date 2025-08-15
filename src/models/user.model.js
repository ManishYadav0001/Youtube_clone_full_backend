import mongoose from 'mongoose';

const userSchema = mongoose.Schema({
    username: {
        type: String,
        require: true,
        lowercase: true,
        trim: true,
        unique: true
    },
    email: {
        type: String,
        require: true,
        unique: true
    },
    fullName: {
        type: String,
        require: true,
        trim: true
    },
    avatar: {
        type: String,
        require: true,
    },
    coverImage: {
        type: String,

    },
    password: {
        type: String,
        require: [true, "please enter your password"]
    },
    refereshToken: {
        type: String,

    },
    watchHistory: {
        type: mongoose.Types.ObjectId,
        ref: "Video"
    }


}, { timestamps: true })


export const User = mongoose.model("User", userSchema)