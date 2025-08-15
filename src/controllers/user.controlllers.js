import { ApiError } from "../utils/ApiError.js";
import { asyncHandler } from "../utils/asyncHandler.js";
import { User } from "../models/user.model.js"
import { UploadOnCloudinary } from "../utils/Cloudinary.js";
import { ApiResponse } from "../utils/ApiResponse.js";


const registerUser = asyncHandler(
    async (req, res) => {

        const { username, email, fullName, password } = req.body;


        if (username == "") {
            throw new ApiError(400, "please enter username")
        }
        if (email == "") {
            throw new ApiError(400, "please enter email")
        }
        if (fullName == "") {
            throw new ApiError(400, "please enter fullName")
        }
        if (password == "") {
            throw new ApiError(400, "please enter password")
        }


        const existedUser = await User.findOne(
            {
                $or: [{username}, {email}]
            }
        )

        if (existedUser) {
            throw new ApiError(409, 'User already existed')
        }

        const avatarLocalpath = req?.files?.avatar?.[0]?.path;
        const coverImageLocalpath = req?.files?.coverImage?.[0]?.path;



        if (!avatarLocalpath) {
            throw new ApiError(400, "avatar is required")
        }
        let coverImage ={};
        if (coverImageLocalpath) {

            coverImage = await UploadOnCloudinary(coverImageLocalpath)

        }


        const avatar = await UploadOnCloudinary(avatarLocalpath)

        if (!avatar) {
            throw new ApiError(500, "Internal error : can't upload avatar")
        }


        const user = await User.create({
            fullName,
            password,
            username: username.toLowerCase(),
            email,
            coverImage: coverImage?.url || "",
            avatar: avatar.url,

        })


        const createdUser = await User.findById(user._id)
            .select("-password -refreshToken")

        if (!createdUser) {
            throw new ApiError(500, "Something went wrong while creating user")
        }

        return res.status(201).json(new ApiResponse(
            201,
            createdUser,
            "User created successfully"
        ))

    }
)





export {
    registerUser
}