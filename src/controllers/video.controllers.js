import mongoose, { isValidObjectId } from "mongoose"
import { Video } from "../models/video.model.js"
import { ApiError } from "../utils/ApiError.js"
import { ApiResponse } from "../utils/ApiResponse.js"
import { asyncHandler } from "../utils/asyncHandler.js"
import { UploadOnCloudinary } from "../utils/Cloudinary.js"



const publishAVideo = asyncHandler(
    async (req, res) => {

        // TODO: get video, upload to cloudinary, create video

        const { title, description } = req.body;
        const userId = req.user?._id;
        const videoLocalPath = req?.files?.videoFile?.[0]?.path;
        const thumbnailLocalPath = req?.files?.thumbnail?.[0]?.path;


        if (!title || !description) {
            throw new ApiError(400, "title or description is required")
        }

        if (!videoLocalPath) {
            throw new ApiError(400, "video file is required")
        }

        if (!thumbnailLocalPath) {
            throw new ApiError(400, "thumbnail  is required")
        }

        const videoData = await UploadOnCloudinary(videoLocalPath)

        if (!videoData) {
            throw new ApiError(500, "can't upload video file")
        }


        const thumbnailData = await UploadOnCloudinary(thumbnailLocalPath)

        if (!thumbnailData) {
            throw new ApiError(500, "can't upload thumbnail ")
        }


        const video = await Video.create({

            videoFile: videoData?.url,
            thumbnail: thumbnailData?.url,
            owner: mongoose.Types.ObjectId(userId),
            title,
            description,
            duration: Math.floor(videoData?.duration),
            views: 0,
            isPublished: true
        })


        if (!video) {
            throw new ApiError(400, "can't save video in DB")
        }


        return res.status(200).json(new ApiResponse(200, video, "video uploaded successfully"))



    })



const updateViewsOnVideo = asyncHandler(
    async (req, res) => {

        //increase video views when someone click on the video
        const { videoId } = req.params;

        if (!isValidObjectId(videoId)) {
            throw new ApiError(404, "video not found")
        }

        const video = await Video.findById(videoId)
        if (!video) {
            throw new ApiError(404, "Video not found");
        }


        video.views = (video.views || 0) + 1;
        await video.save({ validateBeforeSave: false })

        return res.status(200).json(
            new ApiResponse(200, { views: video.views }, "current views on the video is fetched")
        )


    }
)



const getVideoById = asyncHandler(async (req, res) => {

    //TODO: get video by id

    const { videoId } = req.params;

    if (!isValidObjectId(videoId)) {
        throw new ApiError(400, "video not existed")
    }

    const video = await Video.findById(videoId)

    if (!video) {
        throw new ApiError(404, "video not found")
    }

    return res.status(200)
        .json(new ApiResponse(200, video, "Video data fetched successfully"))

})



const getAllVideos = asyncHandler(async (req, res) => {

    //TODO: get all videos based on query, sort, pagination

    const { page = 1, limit = 10, sortBy = "createdAt", sortType = "asc", query } = req.query;
    const userId = req.user._id;

    const aggregateQuery = Video.aggregate([
        {
            $match: {
                owner: mongoose.Types.ObjectId(userId),
                ...(query && {
                    $or: [{title: { $regex :query , options :"i"}},
                    {description: { $regex :query , options :"i"}}
                    ]
                })

            }
        },
        {
            $project: {
                videoFile: 1,
                thumbnail: 1,
                title: 1,
                description: 1,
                duration: 1,
                views: 1,
                isPublished: 1,
                createdAt: 1
            }
        },
        {
            $sort: { [sortBy]: sortType === "asc" ? 1 : -1 }
        }
    ])



    const options = {
        page: parseInt(page),
        limit: parseInt(limit)
    }



    const result = await Video.aggregatePaginate(aggregateQuery, options)

  if (!result.docs.length) {
        throw new ApiError(404, "User did not upload any videos");
    }

        const responseData = {
        videos: result.docs,
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

  



    return res.status(200)
        .json(new ApiResponse(200, responseData, `${limit} videos of page ${page} fetched successfully`))
})



const updateVideo = asyncHandler(async (req, res) => {


    //TODO: update video details like title, description, thumbnail

    const { videoId } = req.params;
    const userId = req.user._id;

    const { title, description } = req.body;

    const thumbnailLocalPath = req.file?.path;

    if (!isValidObjectId(videoId)) {
        throw new ApiError(400, 'invalid videoId')
    }


    if (!title && !description && !thumbnailLocalPath) {
        throw new ApiError(400, "you are not updating any field")
    }





    const video = await Video.findById(videoId)

    if (!video) {
        throw new ApiError(404, "Video not found")
    }




    if (userId.toString() !== video.owner.toString()) {
        throw new ApiError(403, "can't edit others video")
    }

    if (thumbnailLocalPath) {
        const publicId = video.thumbnail.split("/").pop().split(".")[0];


        await cloudinary.uploader.destroy(publicId)

        const thumbnail = await UploadOnCloudinary(thumbnailLocalPath);

        video.thumbnail = thumbnail.url



    }


    if (title) video.title = title


    if (description) video.description = description
    await video.save({ validateBeforeSave: false })




    return res.status(200)
        .json(new ApiResponse(200, video, "video data updated Successfully"))




})



const deleteVideo = asyncHandler(async (req, res) => {
    const { videoId } = req.params;
    const userId = req.user._id;
    if (!isValidObjectId(videoId)) {
        throw new ApiError(400, "videoId is not valid")
    }


    const video = await Video.findById(videoId)

    if (!video) throw new ApiError(404, "Video not found")

    if (video.owner.toString() !== userId.toString()) {
        throw new ApiError(403, "can't delete others video")
    }

    try {
        if (video.thumbnail) {
            const publicId = video.thumbnail.split("/").pop().split(".")[0];
            await cloudinary.uploader.destroy(publicId);
        }
        if (video.videoFile) {
            const publicId = video.videoFile.split("/").pop().split(".")[0];
            await cloudinary.uploader.destroy(publicId);
        }
    } catch (error) {
        console.log(error.message)
    }

    await video.deleteOne();

    return res.status(200)
        .json(new ApiResponse(200, {}, "video deleted successfully"))

})



const togglePublishStatus = asyncHandler(async (req, res) => {
    const { videoId } = req.params;
    const userId = req.user._id;

    if (!isValidObjectId(videoId)) {
        throw new ApiError(400, "invalid videoId")
    }

    const video = await Video.findById(videoId)
    if (!video) {
        throw new ApiError(404, "video not found")
    }

    if (userId.toString() !== video?.owner?.toString()) {
        throw new ApiError(403, "you can't publish or unPublish others video")
    }

    video.isPublished = !video.isPublished;
    await video.save({ validateBeforeSave: false })

    return res.status(200)
        .json(new ApiResponse(200, video, video.isPublished ? "video is now public" : "video is now private"))


})

export {
    getAllVideos,
    publishAVideo,
    getVideoById,
    updateVideo,
    deleteVideo,
    togglePublishStatus,
    updateViewsOnVideo
}