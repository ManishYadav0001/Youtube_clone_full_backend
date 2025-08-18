import mongoose from "mongoose"
import { Comment } from "../models/comment.model.js"
import { ApiError } from "../utils/ApiError.js"
import { ApiResponse } from "../utils/ApiResponse.js"
import { asyncHandler } from "../utils/asyncHandler.js"

const getVideoComments = asyncHandler(async (req, res) => {
    //TODO: get all comments for a video
    const { videoId } = req.params;
    const { page = 1, limit = 10 } = req.query;

    if (!mongoose.Types.ObjectId.isValid(videoId)) {

        throw new ApiError(400, "video Id not valid")
    }

    const aggregate = Comment.aggregate([
        {
            $match: {
                video: new mongoose.Types.ObjectId(videoId)
            }
        },
        {
            $lookup: {
                from: "users",
                foreignField: "_id",
                localField: "owner",
                as: "owner"
            }
        },
        {
            $addFields: {
                owner: {
                    $first: "$owner"
                }
            }
        },
        {
            $sort: { createdAt: -1 } // latest comments first
        }
    ])

    const options = {
        page: parseInt(page),
        limit: parseInt(limit)
    }


    const result = await Comment.aggregatePaginate(aggregate, options);



    const responseData = {
        comments: result.docs,
        pagination: {
            totalDocs: result.totalDocs,
            limit: result.limit,
            totalPages: result.totalPages,
            page: result.page,
            hasNextPage: result.hasNextPage,
            hasPrevPage: result.hasPrevPage,
            nextPage: result.nextPage || null,
            prevPage: result.prevPage || null
        }
    };


    if (!result.docs.length) {

        return res.status(200).json(new ApiResponse(200, responseData, "no comments added on this video"))


    }

    return res.status(200).json(new ApiResponse(200, responseData, "all comment of this video has been fetched"))



})

const addComment = asyncHandler(async (req, res) => {
    // TODO: add a comment to a video
    const { videoId } = req.params;
    const userId = req.user._id;
    const { content } = req.body;


    if (!mongoose.Types.ObjectId.isValid(videoId)) {
        throw new ApiError(400, 'no such video existed')
    }

    if (!userId) {
        throw new ApiError(400, "login to comment")
    }

    if (!content || !content.trim()) {
        throw new ApiError(400, "can't add empty or widespace comment ")
    }

    const comment = await Comment.create({
        content,
        video: mongoose.Types.ObjectId(videoId),
        owner: mongoose.Types.ObjectId(userId)
    })

    if (!comment) {
        throw new ApiError(400, "comment not found")
    }

    res.status(200).json(new ApiResponse(200, comment, "comment added successfully"))
})

const updateComment = asyncHandler(async (req, res) => {
    // TODO: update a comment
    const { commentId } = req.params;
    const userId = req.user._id;
    const { content } = req.body;

    if (!content || !content.trim()) {
        throw new ApiError(400, "can't add empty or widespace comment ")
    }



    if (!userId) {
        throw new ApiError(401, "login to comment")
    }
    if (!mongoose.Types.ObjectId.isValid(commentId)) {
        throw new ApiError(400, "Invalid comment id");
    }


    const comment = await Comment.findById(commentId)


    if (!comment) {
        throw new ApiError(404, "comment not found")
    }


    if (userId.toString() !== comment.owner.toString()) {
        throw new ApiError(403, "can't change others comment")
    }



    comment.content = content.trim();
    await comment.save()

    res.status(200).json(new ApiResponse(200, comment, "comment edited successfully"))
})

const deleteComment = asyncHandler(async (req, res) => {
    const { commentId } = req.params;
    const userId = req.user._id;


    if (!mongoose.Types.ObjectId.isValid(commentId)) {
        throw new ApiError(400, "Invalid comment Id");
    }



    const comment = await Comment.findById(commentId);


    if (!comment) {
        throw new ApiError(404, "comment not found")
    }

    if (userId.toString() !== comment.owner.toString()) {
        throw new ApiError(403, "can't delete others comment")
    }


    await comment.deleteOne();

    return res.status(200).json(new ApiResponse(200, {}, "comment deleted successfully"))



})

export {
    getVideoComments,
    addComment,
    updateComment,
    deleteComment
}