import mongoose from 'mongoose';
import bcrypt from "bcrypt";
import jwt from 'jsonwebtoken'

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


userSchema.methods.generateAccessToken = function () {
    return jwt.sign(
        {
            _id: this._id,
            email: this.email,
            fullName: this.fullName,
            username: this.username
        },

        process.env.ACCESS_TOKEN_SECRET
        ,

        {
            expiresIn: process.env.ACCESS_TOKEN_EXPIRY

        }
    )
}

userSchema.methods.generateRefreshToken = function () {
    return jwt.sign(
        {
            _id: this._id,

        },

        process.env.REFRESH_TOKEN_SECRET
        ,

        {
            expiresIn: process.env.REFRESH_TOKEN_EXPIRY

        }
    )
}



export const User = mongoose.model("User", userSchema)