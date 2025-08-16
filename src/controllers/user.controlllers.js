import { ApiError } from "../utils/ApiError.js";
import { asyncHandler } from "../utils/asyncHandler.js";
import { User } from "../models/user.model.js"
import { UploadOnCloudinary } from "../utils/Cloudinary.js";
import { ApiResponse } from "../utils/ApiResponse.js";
import jwt from "jwt";

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
              cookie("refreshToken", refreshToken , options).
              cookie("accessToken", accessToken , options).
              json( new ApiResponse(200 , {accessToken ,refreshToken} , "Session started again"))
  
      } catch (error) {
        
        throw new ApiError(401 , "Can't refresh your accessToken")
      }
    }
)

export {
    registerUser,
    loginUser,
    logOutUser,
    refreshAccessToken
}