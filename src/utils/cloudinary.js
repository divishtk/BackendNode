import { v2 as cloudinary } from "cloudinary";
import fs from "fs";

// Configuration
cloudinary.config({
  cloud_name: process.env.CLOUD_NAME,
  api_key: process.env.API_KEY,
  api_secret: process.env.SECRET_KEY,
});

const uploadOnCloudinary = async (localFilePath) => {
  try {
    if (!localFilePath) return null;

    //uploading file on cloudinary
    const resp = await cloudinary.uploader.upload(localFilePath, {
      resource_type: "auto",
    });

    fs.unlinkSync(localFilePath); //remove files if uploaded on cloduinary on success/error

    return resp;
  } catch (err) {
    fs.unlinkSync(localFilePath); //removed the locally saved temp files as upload op failed
  }
};


export {uploadOnCloudinary}