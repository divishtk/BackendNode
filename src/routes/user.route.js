import { Router } from "express";
import {
  changeCurrentPassword,
  getCurrentUser,
  loginUser,
  logoutuser,
  refreshAccessToken,
  registerUser,
  updateAccDetails,
  updateUserAvatar,
  updateUserCoverImage,
} from "../controllers/user.controller.js";
import { upload } from "../middlewares/multer.middleware.js";
import { verifyJWT } from "../middlewares/auth.middleware.js";

const router = Router();

router.route("/register").post(
  upload.fields([
    {
      name: "avatar",
      maxCount: 1,
    },
    {
      name: "coverImage",
      maxCount: 1,
    },
  ]),
  registerUser
);

router.route("/login").post(loginUser);

//secured routes
router.route("/logout").post(verifyJWT, logoutuser);

router.route("/refresh-token").post(refreshAccessToken);
router.route("/update-password").post(verifyJWT, changeCurrentPassword);
router.route("/get-currentuser").post(verifyJWT, getCurrentUser);
router.route("/update-account-details").post(verifyJWT, updateAccDetails);

//for uploading single file
router
  .route("/update-avatar")
  .post(upload.single("avatar"), verifyJWT, updateUserAvatar);
router
  .route("/update-coverImage")
  .post(upload.single("coverImage"), verifyJWT, updateUserCoverImage);

export default router;
