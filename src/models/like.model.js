import mongoose from "mongoose";

const likeSchema = mongoose.Schema({

    comment:{
        type: mongoose.Types.ObjectId,
        ref:"Comment"
    },
    video:{
         type: mongoose.Types.ObjectId,
        ref:"Video"
    },
    tweet: {
        type: Schema.Types.ObjectId,
        ref: "Tweet"
    },
    likedBy: {
        type: Schema.Types.ObjectId,
        ref: "User"
    }

},{timestamps:true})

export const Like = mongoose.model("Like" , likeSchema)