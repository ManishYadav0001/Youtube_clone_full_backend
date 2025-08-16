import { Router } from "express";
import { loginUser, logOutUser, refreshAccessToken, registerUser } from "../controllers/user.controlllers.js";
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

// verify routes

router.route("/logout").post(verifyJWT , logOutUser )

router.route("/refreshAccessToken").post(refreshAccessToken)

export default router;