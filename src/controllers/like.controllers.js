import mongoose, { isValidObjectId } from "mongoose"
import { Like } from "../models/like.model.js"
import { ApiError } from "../utils/ApiError.js"
import { ApiResponse } from "../utils/ApiResponse.js"
import { asyncHandler } from "../utils/asyncHandler.js"

const toggleVideoLike = asyncHandler(async (req, res) => {
    //TODO: toggle like on video
    const { videoId } = req.params;

    const userId = req.user?._id;

    if (!mongoose.Types.ObjectId.isValid(videoId)) {
        throw new ApiError(400, "invalid videoId")
    }

    const existedlike = await Like.findOne({
        video: videoId,
        likedBy: userId
    })

    if (existedlike) {
        await existedlike.deleteOne()

        return res.status(200).json(new ApiResponse(200, { videoId, isLiked: false }, "video disliked"))
    }


    const LikedVideo = await Like.create({
        video: videoId,
        likedBy: userId
    })

    return res.status(200).json(new ApiResponse(200, { videoId, isLiked: true }, "video liked"))



})

const toggleCommentLike = asyncHandler(async (req, res) => {
    const { commentId } = req.params
    //TODO: toggle like on comment
    const userId = req.user?._id;

    if (!isValidObjectId(commentId)) {
        throw new ApiError(400, "Invalid comment id")

    }

    const existedLike =  await Like.findOne({
        comment: commentId,
        likedBy: userId
    })

    if (existedLike) {

        await existedLike.deleteOne();
        return res.status(200).json(new ApiResponse(200, { commentId, isLiked: false }, "comment disliked"))
    }


    await Like.create({
        comment: commentId,
        likedBy: userId
    })

    


    return res.status(200).json(new ApiResponse(200, { commentId, isLiked: true } , "comment liked"))

})

const toggleTweetLike = asyncHandler(async (req, res) => {
    const { tweetId } = req.params
    //TODO: toggle like on tweet
    const userId = req.user?._id;

    if (!isValidObjectId(tweetId)) {
        throw new ApiError(400, "Invalid tweet id")

    }

    const existedLike =  await Like.findOne({
        tweet: tweetId,
        likedBy: userId
    })

    if (existedLike) {

        await existedLike.deleteOne();
        return res.status(200).json(new ApiResponse(200, { tweetId, isLiked: false }, "tweet disliked"))
    }


    await Like.create({
         tweet: tweetId,
        likedBy: userId
    })

    


    return res.status(200).json(new ApiResponse(200, { tweetId, isLiked: true } , "tweet liked"))


}
)

const getLikedVideos = asyncHandler(async (req, res) => {
    //TODO: get all liked videos

    const userId = req.user?._id;

    const LikedVideos = await Like.aggregate([
        {
            $match:{
                likedBy: new mongoose.Types.ObjectId(userId)
            }
        },
        {
            $lookup:{
                from:"videos",
                localField:"video",
                foreignField:"_id",
                as:"videoDetails"
            }
        },
        {
            $project:{
               
                videoDetails:1
                
            }
        }
    ])

    if(!LikedVideos.length){
    return res.status(200).json(new ApiResponse(200 , LikedVideos , "user did not liked any video"))
    }

    return res.status(200).json(new ApiResponse(200 , LikedVideos , "all liked  videos fetched"))


})

export {
    toggleCommentLike,
    toggleTweetLike,
    toggleVideoLike,
    getLikedVideos
}