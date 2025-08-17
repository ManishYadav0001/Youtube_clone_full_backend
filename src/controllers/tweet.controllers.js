import mongoose, { isValidObjectId } from "mongoose"
import { Tweet } from "../models/tweet.model.js"
import { User } from "../models/user.model.js"
import { ApiError } from "../utils/ApiError.js"
import { ApiResponse } from "../utils/ApiResponse.js"
import { asyncHandler } from "../utils/asyncHandler.js"

const createTweet = asyncHandler(async (req, res) => {


    const { tweet } = req.body;
    const userId = req.user._id;

    if (!tweet || !tweet.trim()) {
        throw new ApiError(400, "tweet is required")
    }

    if (!userId) {
        throw new ApiError(401, "Unauthorized request")
    }

    const createdTweet = await Tweet.create({
        content: tweet,
        owner: mongoose.Types.ObjectId(req.user?._id)
    })

    if (!createdTweet) {
        throw new ApiError(400, "can't create tweet")
    }

    return res.status(201).json(new ApiResponse(201, createdTweet, "Tweet created"))

})

const getUserTweets = asyncHandler(async (req, res) => {


    const AllTweetByUser = await User.aggregate([
        {
            $match: {
                _id: new mongoose.Types.ObjectId(req.user?._id)
            }
        },
        {
            $lookup: {
                from: "tweets",
                localField: "_id",
                foreignField: "owner",
                as: "mytweets"
            }
        }, {
            $project: {
                username: 1,
                fullName: 1,
                mytweets: 1,
                avatar: 1
            }
        }
    ])

    if (!AllTweetByUser.length) {
        throw new ApiError(404, "User not found or no tweets");
    }


    return res.status(200)
        .json(new ApiResponse(200, AllTweetByUser[0], "All tweets of user has been fetched"))
})

const updateTweet = asyncHandler(async (req, res) => {



    const { tweetId } = req.params;
    const userId = req.user._id;
    const { newtweet } = req.body;


    if (!userId) {
        throw new ApiError(401, "unauthorized request")

    }

    if (!isValidObjectId(tweetId)) {

        throw new ApiError(404, "no tweet exist")
    }

    if (!newtweet) {
        throw new ApiError(400, "please write something in tweet")
    }



    const oldTweet = await Tweet.findById(tweetId)

    if (!oldTweet) {
        throw new ApiError(404, "Tweet does not existed")
    }

    if (!(oldTweet.owner.toString() == userId.toString())) {
        throw new ApiError(403, "You can only edit your tweets")
    }

    oldTweet.content = newtweet;
    await oldTweet.save({ validateBeforeSave: false })


    const UpdatedTweet = oldTweet;



    return res.status(200)
        .json(new ApiResponse(200, UpdatedTweet, "Tweet updated Successfully"))



})

const deleteTweet = asyncHandler(async (req, res) => {



    const userId = req.user._id;
    const { tweetId } = req.params;

    if (!userId) {
        throw new ApiError(401, "unauthorized request")
    }

    if (!isValidObjectId(tweetId)) {
        throw new ApiError(404, "tweet not exist")
    }

    const tweet = await Tweet.findById(tweetId);
    if (!tweet) {
        throw new ApiError(404, "tweet not found")
    }

    if (userId.toString() !== tweet.owner.toString()) {
        throw new ApiError(403, "can't delete others tweet")
    }

    await tweet.deleteOne();

    res.status(200)
        .json(new ApiResponse(200, tweetId, "Tweet deleted Successfully"))

})

export {
    createTweet,
    getUserTweets,
    updateTweet,
    deleteTweet
}