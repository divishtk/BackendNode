import { asyncHandler } from "../utils/asyncHandler.js";
import { apiErrors } from "../utils/apiErrors.js";
import { User } from "../models/user.model.js";
import { uploadOnCloudinary } from "../utils/cloudinary.js";
import { apiResponse } from "../utils/apiResponse.js";
import jwt from "jsonwebtoken";

const generateAcesssAndRefreshTokens = async (userID) => {
  try {
    const user = await User.findById(userID);
    const accessToken = user.generateAccessToken();
    const refreshedToken = user.generateRefreshToken();

    user.refreshedToken = refreshedToken;
    await user.save({ validateBeforeSave: false }); //for kickin values of mongo

    return { accessToken, refreshedToken };
  } catch (err) {
    throw new apiErrors(
      500,
      "Something went wrong ehile generating access / refresh token"
    );
  }
};

const registerUser = asyncHandler(async (req, resp) => {
  const { fullName, email, userName, password } = req.body;

  //console.log("Request Files:", req.files);

  if (
    [fullName, email, userName, password].some(
      (fields) => fields?.trim() === ""
    )
  ) {
    throw new apiErrors(400, "All Fields required");
  }

  const existedUser = await User.findOne({
    $or: [{ userName }, { email }],
  });

  if (existedUser)
    throw new apiErrors(409, "User with email/username already exists");

  const avatarLocalpath = req.files?.avatar[0]?.path;
  if (!avatarLocalpath) throw new apiErrors(400, "Avatar file mandatory");
  const avatar = await uploadOnCloudinary(avatarLocalpath);
  if (!avatar) throw new apiErrors(400, "Avatar required");

  //const coverImageLocalpath =  req.files?.coverImage[0]?.path;

  let coverImageLocalpath;

  if (
    req.files &&
    Array.isArray(req.files.coverImage) &&
    req.files.coverImage.length > 0
  ) {
    coverImageLocalpath = req.files.coverImage[0].path;
  }

  const coverImage = await uploadOnCloudinary(coverImageLocalpath);

  const user = await User.create({
    fullName,
    avatar: avatar.url,
    coverImage: coverImage?.url || "",
    email,
    password,
    userName: userName.toLowerCase(),
  });

  const createdUserCheck = await User.findById(user._id).select(
    "-password -refreshedToken"
  );
  console.log("created check", createdUserCheck);

  if (!createdUserCheck)
    throw new apiErrors(
      500,
      "Somwthing went wrong while registeration of user"
    );

  return resp
    .status(201)
    .json(
      new apiResponse(200, createdUserCheck, "User registered successully")
    );
});

const loginUser = asyncHandler(async (req, resp) => {
  const { email, userName, password } = req.body;

  if (!userName && !email) {
    throw new apiErrors(400, "Username or email is required");
  }

  const user = await User.findOne({
    $or: [{ userName }, { email }],
  });

  if (!user) throw new apiErrors(404, "User does not exists");

  const isPasswordValid = await user.isPasswordCorrect(password);

  if (!isPasswordValid) throw new apiErrors(401, "Password Incorrect");

  const { accessToken, refreshedToken } = await generateAcesssAndRefreshTokens(
    user._id
  );

  const loggedInUser = await User.findById(user._id).select(
    "-password -refreshedToken"
  );

  const cookieOptions = {
    httpOnly: true,
    secure: true,
  };

  return resp
    .status(200)
    .cookie("accessToken", accessToken, cookieOptions)
    .cookie("refreshedToken", refreshedToken, cookieOptions)
    .json(
      new apiResponse(
        200,
        {
          user: loggedInUser,
          accessToken,
          refreshedToken,
        },
        "User logged in successfully"
      )
    );
});

const logoutuser = asyncHandler(async (req, resp) => {
  console.log("reqq", req.body);
  await User.findByIdAndUpdate(
    req.user._id,
    {
      $set: {
        refreshedToken: undefined,
      },
    },
    {
      new: true,
    }
  );

  const cookieOptions = {
    httpOnly: true,
    secure: true,
  };

  return resp
    .status(200)
    .clearCookie("accessToken", cookieOptions)
    .clearCookie("refreshedToken", cookieOptions)
    .json(new apiResponse(200, {}, "User Logged Out"));
});

const refreshAccessToken = asyncHandler(async (req, resp) => {
 try {
   const incomingRefreshToken =
     req.cookies.refreshedToken || req.body.refreshedToken;
   if (!incomingRefreshToken) {
     throw new apiErrors(401, "Refresh token unauthorized");
   }
 
   const decodedToken = jwt.verify(
     incomingRefreshToken,
     process.env.REFRESHED_TOKEN
   );
   const user = await User.findById(decodedToken?._id);
   if (!user) {
     throw new apiErrors(401, "Invalid refresh token");
   }
 
   if (incomingRefreshToken !== user?.refreshedToken) {
     throw new apiErrors(401, "Refresh token is expired or used");
   }
 
   const cookieOptions = {
     httpOnly: true,
     secure : true
   }
 
  const {accessToken, newrefreshedToken} = await generateAcesssAndRefreshTokens(user._id);
 
  return resp.status(200).
  cookie('accessToken',accessToken,cookieOptions).
  cookie('refreshedToken',newrefreshedToken,cookieOptions).
  json(
   new apiResponse(
     200,
     {
       accessToken,
       refreshedToken : newrefreshedToken
     },
     "Access Token Refreshed "
   )
  )
 } catch (error) {
  throw new apiErrors(401,error?.message || "Invalid refresh token")
 }

});

export { registerUser, loginUser, logoutuser, refreshAccessToken };
