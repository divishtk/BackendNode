import { asyncHandler } from "../utils/asyncHandler.js";
import { apiErrors } from "../utils/apiErrors.js";
import { User } from "../models/user.model.js";
import { uploadOnCloudinary } from "../utils/cloudinary.js"
import { apiResponse } from "../utils/apiResponse.js";

const registerUser = asyncHandler(async (req, resp) => {
  const { fullName, email, userName, password } = req.body;


  console.log("Request Files:", req.files)

  if (
    [fullName, email, userName, password].some( (fields) => fields?.trim() === "" )) 
    {
      throw new apiErrors(400,"All Fields required")
    }

    
    const existedUser = await User.findOne({
      $or : [{ userName }, { email }]
    })

    if(existedUser) throw new apiErrors(409,"User with email/username already exists");

   const avatarLocalpath =  req.files?.avatar[0]?.path;
   if(!avatarLocalpath) throw new apiErrors(400,"Avatar file mandatory");
   const avatar = await uploadOnCloudinary(avatarLocalpath);
   if(!avatar) throw new apiErrors(400,"Avatar required");



   //const coverImageLocalpath =  req.files?.coverImage[0]?.path;

   let coverImageLocalpath;

    if(req.files && Array.isArray(req.files.coverImage) && req.files.coverImage.length > 0){
      coverImageLocalpath = req.files.coverImage[0].path;
    }

   const coverImage = await uploadOnCloudinary(coverImageLocalpath);


 
    const user  = await User.create({
      fullName,
      avatar: avatar.url,
      coverImage:coverImage?.url || "",
      email,
      password,
      userName: userName.toLowerCase()
    })

    const createdUserCheck = await User.findById(user._id).select(
      "-password -refreshedToken"
    );

    if(!createdUserCheck) throw new apiErrors(500,"Somwthing went wrong while registeration of user")


      return resp.status(201).json(
        new apiResponse(200,createdUserCheck,"User registered successully")
      )
});

export { registerUser };
