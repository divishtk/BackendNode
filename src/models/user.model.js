import mongoose, { Schema } from "mongoose";
import jwt from "jsonwebtoken";
import bcrypt from "bcrypt";

const userSchema = new mongoose.Schema(
  {
    userName: {
      type: String,
      required: true,
      unique: true,
      lowercase: true,
      trim: true,
      index: true,
    },
    email: {
      type: String,
      required: true,
      unique: true,
      lowercase: true,
      trim: true,
    },
    fullName: {
      type: String,
      required: true,
      unique: true,
      trim: true,
      index: true,
    },
    avatar: {
      type: String, //cloudinary url
    },
    coverImage: {
      type: String, //cloudinary url
    },

    watchedHistory: [
      {
        type: Schema.Types.ObjectId,
        ref: "Video",
      },
    ],

    password: {
      type: String,
      required: [true, "Password is required"],
    },

    refreshedToken: {
      type: String,
    },
  },
  {
    timestamps: true,
  }
);

userSchema.pre("save", async function (next) {
  if (!this.isModified("password")) return next();
  this.password = bcrypt.hash(this.password, 10);
  next();
});

userSchema.methods.isPasswordCorrect = async function (pass) {
  return await bcrypt.compare(pass, this.password); //this.password -> hashed password (encrypted)
};

userSchema.methods.generateAccessToken =  function () {
  return jwt.sign(
    {
      _id: this._id,
      email: this.email,
      userName: this.userName,
      fullname: this.fullName,
    },

    process.env.ACCESS_TOKEN_SECRET,
    {
      expiresIn: process.env.ACCESS_TOKEN_EXPIRY,
    }
  );
};

userSchema.methods.generateRefreshToken = async function () {

    return jwt.sign(
        {
          _id: this._id,
        },
    
        process.env.REFRESHED_TOKEN,
        {
          expiresIn: process.env.REFRESH_TOKEN_EXPIRY,
        }
      );
};

export const User = mongoose.model("User", userSchema);
