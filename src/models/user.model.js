import mongoose from 'mongoose';
import bcrypt from "bcrypt"

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


userSchema.pre("save", async function (next) {

    if (this.isModified('password')) {
        this.password = await bcrypt.hash(this.password, 10)
        next();
    }
    else {
        next();
    }

})

userSchema.methods.isPasswordCorrect = async function (password) {

    return await bcrypt.compare(password, this.password)
}





export const User = mongoose.model("User", userSchema)