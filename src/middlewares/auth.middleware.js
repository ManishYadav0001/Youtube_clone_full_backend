import { User } from "../models/user.model.js";
import { ApiError } from "../utils/ApiError.js";
import { asyncHandler } from "../utils/asyncHandler.js";
import jwt from "jsonwebtoken"
const verifyJWT = asyncHandler(
    async (req, _, next) => {

        try {
            const token = req.cookies.accessToken || req.headers["authorization"]?.replace("Bearer ", "");

            if (!token) {
                throw new ApiError(401, "token is not found")
            }

            const decodedToken = jwt.verify(token, process.env.ACCESS_TOKEN_SECRET)

            if (!decodedToken) {
                throw new ApiError(403, "decodation of token is failed")
            }

            const user = await User.findById(decodedToken._id)

            if (!user) {
                throw new ApiError(404, " User not found")
            }

            req.user = user
            next();



        } catch (error) {
            throw new ApiError(403, "User is not Authenticated")
        }
    }
)
export {verifyJWT}