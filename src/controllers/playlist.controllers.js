import mongoose, { isValidObjectId } from "mongoose"
import { Playlist } from "../models/playlist.model.js"
import { ApiError } from "../utils/ApiError.js"
import { ApiResponse } from "../utils/ApiResponse.js"
import { asyncHandler } from "../utils/asyncHandler.js"
import { app } from "../app.js"


const createPlaylist = asyncHandler(async (req, res) => {
    //TODO: create playlist
    const { name, description } = req.body;
    const userId = req.user._id;

    if (!name) {
        throw new ApiError(400, "name  is required for creating a playlist")
    }

    if (!userId) {
        throw new ApiError(401, "can't create playlist without login or signup")
    }

    const existingPlaylist = await Playlist.findOne({
        playlistName: name,
        owner: userId
    });
    if (existingPlaylist) {
        throw new ApiError(409, "playlist with this name already exists");
    }

    const playlist = await Playlist.create({
        playlistName: name.trim(),
        description: description || "",
        owner: new mongoose.Types.ObjectId(userId)
    })

    if (!playlist) {
        throw new ApiError(500, "can't able to create playlist")
    }

    return res.status(201).json(new ApiResponse(201, playlist, "playlist created successfully"))
})

const getUserPlaylists = asyncHandler(async (req, res) => {
    //TODO: get user playlists

    const { userId } = req.params;

    if (!mongoose.Types.ObjectId.isValid(userId)) {
        throw new ApiError(400, "Invalid UserId")
    }

    const playlists = await Playlist.find({ owner: userId }).sort({ createdAt: -1 });



    return res.status(200).json(new ApiResponse(200, playlists, playlists.length ? "all playlists fetched" : "not created any playlist yet"))

})

const getPlaylistById = asyncHandler(async (req, res) => {
    const { playlistId } = req.params;

    if (!mongoose.Types.ObjectId.isValid(playlistId)) {
        throw new ApiError(400, 'invalid playlist Id')
    }

    const playlist = await Playlist.aggregate([
        {
            $match: {
                _id: new mongoose.Types.ObjectId(playlistId)
            }
        },
        {
            $lookup: {
                from: "users",
                foreignField: "_id",
                localField: "owner",
                as: "owner",
                pipeline: [
                    {
                        $project: {
                            username: 1,
                            fullName: 1,
                            avatar: 1,
                            email: 1
                        }
                    }
                ]
            }
        },

        {
            $lookup: {
                from: "videos",
                foreignField: "_id",
                localField: "videos",
                as: "videos"
            }
        }, {

            $addFields: {
                owner: {
                    $first: "$owner"
                }
            }

        }
    ])

    if (!playlist.length) {
        throw new ApiError(404, "playlist not found")
    }

    return res.status(200).json(new ApiResponse(200, playlist[0], " playlist fetched"))




})

const addVideoToPlaylist = asyncHandler(async (req, res) => {
    const { playlistId, videoId } = req.params;

    if (!mongoose.Types.ObjectId.isValid(playlistId) || !mongoose.Types.ObjectId.isValid(videoId)) {
        throw new ApiError(400, "playlistId or videoId is invalid")
    }

    const playlist = await Playlist.findById(playlistId)

    if (!playlist) {
        throw new ApiError(404, "playlist not found")
    }

    if (playlist.videos.some(v => v.toString() === videoId.toString())) {
        throw new ApiError(400, "Video already in playlist");
    }

    playlist.videos.push(videoId)
    await playlist.save({ validateBeforeSave: false })

    return res.status(200).json(new ApiResponse(200, playlist, "Video added to playlist"))




})

const removeVideoFromPlaylist = asyncHandler(async (req, res) => {
    // TODO: remove video from playlist
    const { playlistId, videoId } = req.params;

    if (!mongoose.Types.ObjectId.isValid(playlistId) || !mongoose.Types.ObjectId.isValid(videoId)) {
        throw new ApiError(400, 'invalid playlist or video Id')
    }

    const playlist = await Playlist.findById(playlistId);



    if(!playlist){
        throw new ApiError(404 , 'playlist not found')
    }


    if (!playlist.videos.some(v => v.toString() === videoId.toString())) {
        throw new ApiError(404, "Video not found in this playlist");
    }
   

    playlist.videos = playlist.videos.filter(e=> e.toString() !== videoId)
    await playlist.save()

    return res.status(200).json(new ApiResponse(200 , playlist , "video has been removed from the playlist successfully"))

})

const deletePlaylist = asyncHandler(async (req, res) => {
    // TODO: delete playlist
    const { playlistId } = req.params;

    if(!mongoose.Types.ObjectId.isValid(playlistId)){
        throw new ApiError(400 , 'invalid playlist Id')
    }

    const playlist = await Playlist.findById(playlistId);

    if(!playlist){
        throw new ApiError(404 , "playlist not found")
    }

    await playlist.deleteOne();

    return res.status(200).json(new ApiResponse(200 , null , 'playlist deleted successfully'))
})

const updatePlaylist = asyncHandler(async (req, res) => {
    //TODO: update playlist
    const { playlistId } = req.params;
    const { name, description } = req.body;

    if(!name && !description){
        throw new ApiError(400 , "name or  description is required")
    }

    if(!mongoose.Types.ObjectId.isValid(playlistId)){
        throw new ApiError(400 , 'invalid playlist Id')
    }

    const playlist = await Playlist.findByIdAndUpdate(
        playlistId,
        {
            playlistName:name,
            description
        },
        {
            new:true
        }
    )

    if(!playlist){
        throw new ApiError(404 , "playlist not found")
    }

    return res.status(200).json(new ApiResponse(200 , playlist , "playlist updated successfully"))

})

export {
    createPlaylist,
    getUserPlaylists,
    getPlaylistById,
    addVideoToPlaylist,
    removeVideoFromPlaylist,
    deletePlaylist,
    updatePlaylist
}