import { asyncHandler } from "../utils/asyncHandler.js";
import { apiErrors } from "../utils/apiErrors.js";
import { User } from "../models/user.model.js";
import { uploadOnCloudinary } from "../utils/cloudinary.js"
import { apiResponse } from "../utils/apiResponse.js";

const registerUser = asyncHandler(async (req, resp) => {
  const { fullname, email, username, password } = req.body;
  console.log(email);

  // if(fullname === ""){
  //   throw new apiErrors(400,"Full Name is required")

  // }

  if (
    [fullname, email, username, password].some( (fields) => fields?.trim() === "" )) 
    {
      throw new apiErrors(400,"All Fields required")
    }

    const existedUser = User.findOne({
      $or : [{ username }, { email }]
    })

    if(existedUser) throw new apiErrors(409,"User with email/username already exists");

   const avatarLocalpath =  req.files?.avatar[0]?.path;
   if(!avatarLocalpath) throw new apiErrors(400,"Avatar file mandatory");
   const avatar = await uploadOnCloudinary(avatarLocalpath);
   if(!avatar) throw new apiErrors(400,"Avatar required");



   const coverImageLocalpath =  req.files?.coverImage[0]?.path;
   const coverImage = await uploadOnCloudinary(coverImageLocalpath);

 
    const user  = await User.create({
      fullname,
      avatar: avatar.url,
      coverImage:coverImage?.url || "",
      email,
      password,
      username: username.toLowerCaswe()
    })

    const createdUserCheck = await User.findById(user._id).select(
      "-password -refreshedToken"
    );

    if(!createdUserCheck) throw new apiErrors(500,"Somwthing went wrong while registeration of user")


      return resp.status(201).json(
        new apiResp(200,createdUserCheck,"User registered successully")
      )
      const apiResp = await apiResponse()



  //   resp.status(200).json({
  //     messaege: "OK",
  //   });
});

export { registerUser };
