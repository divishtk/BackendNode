import { User } from "../models/user.model.js";
import { apiErrors } from "../utils/apiErrors.js";
import { asyncHandler } from "../utils/asyncHandler.js";
import jwt from "jsonwebtoken";

export const verifyJWT = asyncHandler(async (req, _, next) => {
  try {
    const token =
      req.cookies?.accessToken ||
      req.header("Authorization")?.replace("Bearer ", "");

     /* const header = req.headers.authorization;
      if(!header){
        throw new apiErrors(401, "Token not found");
      }
      console.log('header',header)
      const token = header.split(" ")[1];*/

    if (!token) {
      throw new apiErrors(401, "Unauthorized request");
    }

    const decodedToken = jwt.verify(token, process.env.ACCESS_TOKEN_SECRET);

    const user = await User.findById(decodedToken?._id).select(
      "-password -refreshedToken"
    );

    if (!user) throw new apiErrors(401, "Invalid Access Token");

    req.user = user;
    next();
  } catch (error) {
    throw new apiErrors(401, error?.message || "Invalid Access Token");
  }
});

