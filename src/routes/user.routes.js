import { Router } from "express";
import { changePaasword, ChannelDetails, getCurrentUser, GetWatchHistory, loginUser, logOutUser, refreshAccessToken, registerUser, updateAvatar, updateCoverImage, updateUserDetails } from "../controllers/user.controlllers.js";
import { upload } from "../middlewares/multer.middleware.js";
import { verifyJWT } from "../middlewares/auth.middleware.js";

const router = Router();

router.route("/registerUser").post(
  upload.fields([
    { name: "avatar", maxCount: 1 },
    { name: "coverImage", maxCount: 1 }
  ])
  , registerUser)

router.route("/login").post(loginUser)

router.route("/refreshAccessToken").post(refreshAccessToken)

// verify routes -->

router.route("/logout").post(verifyJWT, logOutUser)


router.route("/change-Password").patch(verifyJWT, changePaasword)

router.route("/Current-user").get(verifyJWT, getCurrentUser)

router.route("/update-user-details").patch(verifyJWT, updateUserDetails)

router.route("/update-user-avatar").patch(verifyJWT, upload.single("avatar"), updateAvatar)

router.route("/update-user-coverImage").patch(verifyJWT, upload.single("coverImage"), updateCoverImage)

router.route("/Channel-Details").get(verifyJWT, ChannelDetails)
router.route("/watch-history").get(verifyJWT, GetWatchHistory)

export default router;