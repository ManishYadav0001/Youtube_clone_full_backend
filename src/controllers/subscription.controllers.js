import mongoose, { isValidObjectId } from "mongoose"
import { Subscription } from "../models/subscription.model.js"
import { ApiError } from "../utils/ApiError.js"
import { ApiResponse } from "../utils/ApiResponse.js"
import { asyncHandler } from "../utils/asyncHandler.js"


const toggleSubscription = asyncHandler(async (req, res) => {
    // TODO: toggle subscription


    const { channelId } = req.params;
    const userId = req.user._id;

    if (!isValidObjectId(channelId)) {

        throw new ApiError(400, "invalid channel id")
    }

    if (!userId) {
        throw new ApiError(400, "can't recognize the User")
    }


    const existedUser = await Subscription.findOne({
        subscriber: userId,
        channel: channelId
    })


    if (existedUser) {
        await Subscription.deleteOne({
            _id: existedUser._id
        })

        return res.status(200).json(new ApiResponse(200, {}, "Channel Unsubscribed"))
    }

    else {

        const subscription = await Subscription.create({
            subscriber: mongoose.Types.ObjectId(userId),
            channel: mongoose.Types.ObjectId(channelId)
        })

        if (!subscription) {
            throw new ApiError(400, " can't subscribe channel")
        }

        return res.status(200).json(new ApiResponse(200, subscription, "Channel Subscribed"))
    }






})

const getUserChannelSubscribers = asyncHandler(async (req, res) => {
    // controller to return subscriber list of a channel
    const { channelId } = req.params;

    if (!isValidObjectId(channelId)) {
        throw new ApiError(400, "channel Id not valid")
    }

    const subscribers = await Subscription.aggregate([
        {
            $match: {
                channel: new mongoose.Types.ObjectId(channelId)
            }
        },
        {
            $lookup: {
                from: "users",
                foreignField: "_id",
                localField: "subscriber",
                as: "subscriber",
                pipeline: [
                    {
                        $project: {
                            username: 1,
                            fullName: 1,
                            avatar: 1,
                            email: 1,


                        }
                    }]

            },


        }, {
            $addFields: {

                subscriber: {
                    $first: "$subscriber"
                }
            },


        },
        {
            $replaceRoot: { newRoot: "$subscriber" }
        }
    ])

    if (!subscribers.length) {
        return res.status(200).json(new ApiResponse(200, [], "no subscriber of this channel has been fetched"))

    }

    return res.status(200).json(new ApiResponse(200, subscribers, "all subscriber of this channel has been fetched"))

})

const getSubscribedChannels = asyncHandler(async (req, res) => {
    // controller to return channel list to which user has subscribed
    const { subscriberId } = req.params;
    const userId = req.user._id;

    if (!isValidObjectId(subscriberId)) {
        throw new ApiError(400, "can't find the subscriber")
    }

    if (!userId) {
        throw new ApiError(404, "user not found")
    }

    const channelList = await Subscription.aggregate([
        {
            $match: {
                subscriber: new mongoose.Types.ObjectId(userId)
            }
        },
        {
            $lookup: {
                from: "users",
                foreignField: "_id",
                localField: "channel",
                as: "channel",
                pipeline: [
                    {
                        $project: {

                            username: 1,
                            fullName: 1,
                            avatar: 1,
                            email: 1,


                        }
                    }
                ]
            }

        }, {
            $addFields: {
                channel: {
                    $first: "$channel"
                }
            }
        }, {
            $replaceRoot: { newRoot: "$channel" }
        }
    ])

    if (!channelList.length) {
        return res.status(200).json(new ApiResponse(200, [], "no subscribed channel fetched"))

    }

    return res.status(200).json(new ApiResponse(200, channelList, "all subscribed channel fetched"))
})

export {
    toggleSubscription,
    getUserChannelSubscribers,
    getSubscribedChannels
}