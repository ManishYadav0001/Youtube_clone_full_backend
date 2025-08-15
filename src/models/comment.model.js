import mongoose from "mongoose";

const commentSchema = mongoose.Schema({

    content: {
        type: String,
        require: true
    },
    owner: {
        type: mongoose.Types.ObjectId,
        ref: "User"
    },
    video: {
        type: mongoose.Types.ObjectId,
        ref: "Video"
    }

}, { timestamps: true })

export const Comment = mongoose.model("Comment", commentSchema)