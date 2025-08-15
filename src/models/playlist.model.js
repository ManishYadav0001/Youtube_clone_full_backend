import mongoose from 'mongoose';

const playlistschema = mongoose.Schema({

    playlistName: {
        type: String,
        require: true
    },
    description: {
        type: String,
        require: true
    },
    videos: [
        {
            type: mongoose.Types.ObjectId,
            ref: "Video"
        }
    ],
    owner: {
        type: mongoose.Types.ObjectId,
        ref: "User"
    }

}, { timestamps: true })

export const Playlist = mongoose.model("Playlist", playlistschema)