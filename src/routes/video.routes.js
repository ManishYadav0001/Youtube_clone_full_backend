import { Router } from 'express';
import {
    deleteVideo,
    getAllVideos,
    getVideoById,
    publishAVideo,
    togglePublishStatus,
    updateVideo,
    updateViewsOnVideo,
} from "../controllers/video.controllers.js"
import { verifyJWT } from "../middlewares/auth.middleware.js"
import { upload } from "../middlewares/multer.middleware.js"

const router = Router();
router.use(verifyJWT); // Apply verifyJWT middleware to all routes in this file


router.post(
    "/upload",
    verifyJWT,
    upload.fields([
        { name: "videoFile", maxCount: 1 },
        { name: "thumbnail", maxCount: 1 },
    ]),
    publishAVideo
);

//get allvideos
router.get("/", getAllVideos);

// GET a video by ID
router.get("/:videoId", getVideoById);

// PATCH update video (thumbnail, title, description)
router.patch("/:videoId/update", verifyJWT, upload.single("thumbnail"), updateVideo);

// DELETE a video
router.delete("/:videoId/delete", verifyJWT, deleteVideo);



router.route("/toggle/publish/:videoId").patch(togglePublishStatus);


router.route("/:videoId/views").post(updateViewsOnVideo)

export default router