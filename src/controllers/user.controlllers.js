import { ApiError } from "../utils/ApiError.js";
import { asyncHandler } from "../utils/asyncHandler.js";
import { User } from "../models/user.model.js"
import { UploadOnCloudinary } from "../utils/Cloudinary.js";
import { ApiResponse } from "../utils/ApiResponse.js";
import jwt from "jsonwebtoken";

const generateAccessAndRefereshToken = async (userId) => {

    try {
        const user = await User.findById(userId)

        if (!user) {
            throw new ApiError(404, "user not found")
        }

        const refreshToken = user.generateRefreshToken()

        const accessToken = user.generateAccessToken()

        user.refreshToken = refreshToken;
        await user.save({ validateBeforeSave: false })

        return { refreshToken, accessToken }



    } catch (error) {
        throw new ApiError(500, "can't generate Tokens")
    }

}

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
                $or: [{ username }, { email }]
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
        let coverImage = {};
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

const loginUser = asyncHandler(
    async (req, res) => {
        const { username, email, password } = req.body;

        if (!username && !email) {
            throw new ApiError(400, "username or email is required")
        }

        const user = await User.findOne(
            {
                $or: [{ username }, { email }]
            }

        )

        if (!user) {
            throw new ApiError(404, "User not found in the database")
        }


        const isPassValid = await user.isPasswordCorrect(password)

        if (!isPassValid) {
            throw new ApiError(400, "Incorrect Password")
        }

        const { refreshToken, accessToken } = await generateAccessAndRefereshToken(user._id)

        const LoggedInUser = await User.findById(user._id).select("-password -refreshToken")

        if (!LoggedInUser) {
            throw new ApiError(400, "can't logIn")
        }

        const options = {
            httpOnly: true,
            secure: true
        }

        return res.status(200).
            cookie("refreshToken", refreshToken, options).
            cookie("accessToken", accessToken, options).
            json(
                new ApiResponse(200, LoggedInUser, "user loggedIn successfully")
            )


    }
)

const logOutUser = asyncHandler(
    async (req, res) => {

        await User.findByIdAndUpdate(
            req.user._id,
            {

                $set: {
                    refreshToken: ""
                }

            }, {
            new: true
        }
        )

        const options = {
            httpOnly: true,
            secure: true
        }


        return res.status(200).clearCookie("accessToken", options)
            .clearCookie("refreshToken", options)
            .json(
                new ApiResponse(200, {}, "User loggedOut Successfully")
            )
    }
)

const refreshAccessToken = asyncHandler(
    async (req, res) => {

        try {
            const token = req.cookies.refreshToken || req.body.refreshToken


            if (!token) {
                throw new ApiError(401, "Unauthorized request")

            }

            const decodedToken = jwt.verify(token, process.env.REFRESH_TOKEN_SECRET)

            if (!decodedToken) {
                throw new ApiError(400, "token decoding error")
            }

            const user = await User.findById(decodedToken._id)

            if (token !== user.refreshToken) {
                throw new ApiError(403, "refresh token is invalid or expired")
            }

            const { refreshToken, accessToken } = await generateAccessAndRefereshToken(user._id)

            const options = {
                httpOnly: true,
                secure: true
            }

            return res.status(200).
                cookie("refreshToken", refreshToken, options).
                cookie("accessToken", accessToken, options).
                json(new ApiResponse(200, { accessToken, refreshToken }, "Session started again"))

        } catch (error) {

            throw new ApiError(401, "Can't refresh your accessToken")
        }
    }
)

const changePaasword = asyncHandler(
    async (req, res) => {

        const { oldPassword, newPassword } = req.body;

        if (!oldPassword || !newPassword) {
            throw new ApiError(400, "old and new passwords are required")
        }

        const user = await User.findById(req.user?._id)

        const isPassValid = await user.isPasswordCorrect(oldPassword)

        if (!isPassValid) {
            throw new ApiError(400, "Current password is wrong")
        }

        user.password = newPassword;
        await user.save({ validateBeforeSave: false })


        return res.status(200).
            json(new ApiResponse(200, {}, "Password changed Successfully"))

    }
)

const getCurrentUser = asyncHandler(
    async (req, res) => {

        return res
            .status(200)
            .json(new ApiResponse(200, req.user, "Current user fetched"))
    }
)

const updateUserDetails = asyncHandler(
    async (req, res) => {
        const { username, fullName, email } = req.body;

        if (!username || !fullName || !email) {
            throw new ApiError(400, " fill all the fields")
        }


        const existingEmail = await User.findOne(
            {
                email,
                _id: { $ne: req.user._id }

            }
        );
        if (existingEmail) {
            throw new ApiError(400, "Email  already in use");
        }

        const existedUsername = await User.findOne(
            {
                username,
                _id: { $ne: req.user._id }
            }
        )

        if (existedUsername) {
            throw new ApiError(400, "username  already in use");
        }


        const user = await User.findByIdAndUpdate(
            req.user?._id,
            {
                $set: {
                    username,
                    fullName,
                    email
                }
            },
            {
                new: true
            }
        ).select("-password -refreshToken")


        if (!user) {
            throw new ApiError(404, "user not found")
        }

        res.status(200)
            .json(
                new ApiResponse(200, user, "Details updated successfully")
            )



    }
)

const updateAvatar = asyncHandler(

    async (req , res)=>{

        // deleting previos avatar from cloudanary
             const currentuserId = req.user._id;

            const currentUserAvatar = await User.findById(currentuserId).select("avatar");

            if (!currentUserAvatar || !currentUserAvatar.avatar) {
                throw new ApiError(404, "current user avatar not found")
            }

            const publicId = currentUserAvatar.avatar.split("/").pop().split(".")[0];

            await cloudinary.uploader.destroy(publicId)

            // adding new avatar

        const avatarLocalpath = req.file?.path

        if(!avatarLocalpath){
            throw new ApiError(404 , "avatar not found")
        }

        const avatar = await UploadOnCloudinary(avatarLocalpath)

        if(!avatar?.url){
            throw new ApiError(500 , "uploadation of avatar on cloudanary is failed")
        }

        const user = await User.findByIdAndUpdate(
            req.user._id,
            {
                $set:{
                    avatar : avatar.url
                }
            },
            {
                new:true
            }
        ).select("-password -refreshToken")

        if(!user){
            throw new ApiError(404 , "User not found")
        }

        return res.status(200)
                .json(new ApiResponse(200 , user , "Avatar changed successfully"))
    }
)

const updateCoverImage = asyncHandler(

    async (req , res)=>{

        // deleting previos coverImage from cloudanary
             const currentuserId = req.user._id;

            const currentUsercoverImage = await User.findById(currentuserId).select("coverImage");

            if (!currentUsercoverImage || !currentUsercoverImage.coverImage) {
                throw new ApiError(404, "current user coverImage not found")
            }

            const publicId = currentUsercoverImage.coverImage.split("/").pop().split(".")[0];

            await cloudinary.uploader.destroy(publicId)

            // adding new coverImage

        const coverImageLocalpath = req.file?.path

        if(!coverImageLocalpath){
            throw new ApiError(404 , "coverImage not found")
        }

        const coverImage = await UploadOnCloudinary(coverImageLocalpath)

        if(!coverImage?.url){
            throw new ApiError(500 , "uploadation of coverImage on cloudanary is failed")
        }

        const user = await User.findByIdAndUpdate(
            req.user._id,
            {
                $set:{
                    coverImage : coverImage.url
                }
            },
            {
                new:true
            }
        ).select("-password -refreshToken")

        if(!user){
            throw new ApiError(404 , "User not found")
        }

        return res.status(200)
                .json(new ApiResponse(200 , user , "coverImage changed successfully"))
    }
)



export {
    registerUser,
    loginUser,
    logOutUser,
    refreshAccessToken,
    changePaasword,
    getCurrentUser,
    updateUserDetails,
    updateAvatar,
    updateCoverImage
}