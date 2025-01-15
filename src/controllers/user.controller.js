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
    const refreshedToken = await user.generateRefreshToken();

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
    console.log("ree", req.cookies);
    const incomingRefreshToken =
      req.cookies.refreshedToken || req.body.refreshedToken;

    if (!incomingRefreshToken) {
      throw new apiErrors(401, "Refresh token unauthorized");
    }

    const decodedToken = jwt.verify(
      incomingRefreshToken,
      process.env.REFRESHED_TOKEN
    );

    console.log("decoded refesh", decodedToken);

    const user = await User.findById(decodedToken?._id);
    if (!user) {
      throw new apiErrors(401, "Invalid refresh token");
    }

    if (incomingRefreshToken !== user?.refreshedToken) {
      throw new apiErrors(401, "Refresh token is expired or used");
    }

    const cookieOptions = {
      httpOnly: true,
      secure: true,
    };

    const { accessToken, refreshedToken } =
      await generateAcesssAndRefreshTokens(user._id);

    return resp
      .status(200)
      .cookie("accessToken", accessToken, cookieOptions)
      .cookie("refreshedToken", refreshedToken, cookieOptions)
      .json(
        new apiResponse(
          200,
          {
            accessToken,
            refreshedToken: refreshedToken,
          },
          "Access Token Refreshed"
        )
      );
  } catch (error) {
    throw new apiErrors(401, error?.message || "Invalid refresh token");
  }
});

const changeCurrentPassword = asyncHandler(async (req, resp) => {
  try {
    const { oldPassword, newpassword } = req.body;

    const user = await User.findById(req.user?._id);
    const isPassCorrect = await user.isPasswordCorrect(oldPassword);
    if (!isPassCorrect) {
      throw new apiErrors(400, "Invalid Password");
    }
    user.password = newpassword;
    await user.save({ validateBeforeSave: false });
  
    return resp
      .status(200)
      .json(new apiResponse(200, {}, "Password changed Successfully"));
  } catch (error) {
    return resp
      .status(401)
      .json(new apiErrors(401, error?.message,"Something went wrong" ));
  }
});

const getCurrentUser = asyncHandler(async (req, resp) => {
  const currentLoggedInUser = req.user;

  return resp
    .status(200)
    .json(
      new apiResponse(200, currentLoggedInUser, "User fetched successfully")
    );
});
const updateAccDetails = asyncHandler(async (req, resp) => {
  const {fullName ,email} = req.body
  if(!fullName || !email){
    throw new apiErrors(400,"All fields are required");
  }

  const updatedInfo = await User.findByIdAndUpdate(
    req.user?._id,
    {
      $set: {
        fullName,
        email: email
      }
    },
    {
      new:true
    }
  ).select("-password")

  return resp
    .status(200)
    .json(
      new apiResponse(200, updatedInfo, "Account updated successfully")
    );
});

const updateUserAvatar = asyncHandler(async (req, resp) => {

  const avatarLocalPath = req.file?.path;
  if (!avatarLocalPath) {
    throw new apiErrors(400, "Avatar file missing");
  }

  const avatar = await uploadOnCloudinary(avatarLocalPath);
  if(avatar.path){
      throw new apiErrors(400, "Error while uploading avatar");
  }
  console.log('req',req.user)

  const user = await User.findByIdAndUpdate(
    req.user?._id,
    {
      $set:{
        avatar : avatar.path
      }
    },
    {
      new:true
    }
  ).select("-password")
  return resp
  .status(200)
  .json(
    new apiResponse(200, user, "Avatar Image upadted successfully")
  );
});

const updateUserCoverImage = asyncHandler(async (req, resp) => {

  const coverImageLocalPath = req.file?.path;
  if (!coverImageLocalPath) {
    throw new apiErrors(400, "Cover Image file missing");
  }

  const coverImage = await uploadOnCloudinary(coverImageLocalPath);
  if(coverImage.path){
      throw new apiErrors(400, "Error while uploading avatar");
  }

  const user = await User.findByIdAndUpdate(
    req.user?._id,
    {
      $set:{
        coverImage : coverImage.path
      }
    },
    {
      new:true
    }
  ).select("-password")
  return resp
  .status(200)
  .json(
    new apiResponse(200, user, "Cover Image upadted successfully")
  );
});

export {
  registerUser,
  loginUser,
  logoutuser,
  refreshAccessToken,
  changeCurrentPassword,
  getCurrentUser,
  updateAccDetails,
  updateUserAvatar,
  updateUserCoverImage
};
