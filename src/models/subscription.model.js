import mongoose from "mongoose";

const subscriptionSchema = mongoose.Schema({

    subscriber:{
        type:mongoose.Types.ObjectId, // one who subscribed you
        ref:"User"
    },
    channel:{
        type:mongoose.Types.ObjectId, // one who subscribed by you
        ref:"User"
    }

},{timestamps:true})

export const Subscription = mongoose.model("Subscription", subscriptionSchema)