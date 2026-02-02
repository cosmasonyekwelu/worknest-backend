import User from "../models/user.js";
import crypto from "crypto";
import bcrypt from "bcryptjs";
import mailService from "./email.service.js"
import jwt from "jsonwebtoken";
import responseHandler from "../lib/responseHandler.js";

const { errorResponse, notFoundResponse } = responseHandler;

const authService = {
  // registration service
  register: async (req, next) => {
    // checking if email already exists
    const emailExists = await User.findOne({ email: req.body.email });
    if (emailExists) {
      return next(errorResponse("Email already exists", 400));
    }
    // sending verification code if email does not exist
    const verificationCode = crypto.randomInt(100000, 999999).toString(); //6 characters
    const verificationCodeExpiry = new Date(Date.now() + 3600000); //1hr expiry
    //handling password encryption
    const salt = await bcrypt.genSalt(10); //degree of encryption
    const hashedPassword = await bcrypt.hash(req.body.password, salt);
    //proceed to creating our user
    const user = await User.create({
      email: req.body.email,
      fullname: req.body.fullname,
      password: hashedPassword,
      verificationToken: verificationCode,
      verificationTokenExpiry: verificationCodeExpiry,
    });
    //proceed to sending email to user
    // preventing email service from blocking user creation
    process.nextTick(() => {
            mailService.sendWelcomeMail(user).catch(console.error); //catch email sending error

    });
    // sending error to middleware if user creation fails
    if (!user) {
      return next(errorResponse("User registration failed", 500));
    }
    return user;
  },

  // login service
  login: async (req, next) => {
    const user = await User.findOne({ email: req.body.email }).select(
      "+password"
    );
    if (!user) {
      return next(errorResponse("Account not found", 401));
    }

    // Check if user is an admin - admins must use the admin login route
    if (user.role === "admin") {
      return next(
        errorResponse(
          "Admins must use the admin login route. Please visit /admin/login.",
          403
        )
      );
    }

    // handle password comparison
    const isPasswordValid = await bcrypt.compare(
      req.body.password,
      user.password
    );
    if (!isPasswordValid) {
      return next(errorResponse("Incorrect email or password", 401));
    }
    return user;
  },
  authenticateUser: async (userId, next) => {
       //get userId from our jwt decoded token
    const user = await User.findById(userId);
    if (!user) {
      return next(notFoundResponse("User not found"));
    }
    return user;
  },
    //get a new accessToken when current one expires
  refreshAccessToken: async (refreshToken, next) => {
    if (!refreshToken) {
      return next(errorResponse("Refresh token is required", 401));
    }
    //verify the refresh token
    const decoded = jwt.verify(refreshToken, process.env.JWT_SECRET_KEY);
    if (!decoded) {
      return next(errorResponse("Invalid refresh token", 401));
    }
    const user = await User.findById(decoded.id);
    if (!user) {
      return next(notFoundResponse("User account not found"));
    }
    return user;
  },
    verifyUserAccount: async (data, next) => {
    //destructure data
    const { userId, verificationToken } = data;
    //find our user, and get the verificationToken/Expiry saved to the user
    const user = await User.findById(userId).select(
      "+verificationToken +verificationTokenExpiry"
    );
    if (!user) {
      return next(notFoundResponse("Account not found"));
    }
    //check if user is already verified
    if (user.isVerified) {
      return next(errorResponse("Account is already verified", 400));
    }
    //check if verificationToken saved in db is same as the one received from the form
    if (user.verificationToken !== verificationToken) {
      return next(errorResponse("Invalid verification token", 400));
    }
    //check for token expiry
    if (user.verificationTokenExpiry < new Date()) {
      user.verificationToken = undefined;
      user.verificationTokenExpiry = undefined;
      await user.save();
      return next(
        errorResponse(
          "Verification token has expired, please get a new one",
          400
        )
      );
    }
    //verify user if token has not expired
    user.isVerified = true;
    user.verificationToken = undefined;
    user.verificationTokenExpiry = undefined;
    await user.save();
    return user;
  },
    resendVerificationToken: async (userId, next) => {
    const user = await User.findById(userId).select(
      "+verificationToken +verificationTokenExpiry"
    );
    if (!user) {
      return next(notFoundResponse("Account not found"));
    }
    if (user.isVerified) {
      return next(notFoundResponse("Account already verified"));
    }
    const verificationCode = crypto.randomInt(100000, 999999).toString();
    const verificationCodeExpiry = new Date(Date.now() + 3600000); //1 hr
    user.verificationToken = verificationCode;
    user.verificationTokenExpiry = verificationCodeExpiry;
    await user.save();
    process.nextTick(() => {
      mailService.sendVerificationCode(user).catch(async (error) => {
        user.verificationToken = undefined;
        user.verificationTokenExpiry = undefined;
        await user.save();
        console.error("Failed to send verification token", error);
      });
    });
    return user;
  },
    logout: async (req, res, next) => {
      res.cookie("userRefreshToken", "", {
        maxAge: 0,
        httpOnly: true,
        secure: process.env.NODE_ENV === "production",
        sameSite: process.env.NODE_ENV === "production" ? "none" : "lax",
        path: "/api/v1/auth/refresh-token",
      });
      return true;
    },
};

export default authService;
