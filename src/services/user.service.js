import User from "../models/user.js";
import responseHandler from "../lib/responseHandler.js";
import crypto from "crypto";
import bcrypt from "bcryptjs";
import mailService from "./email.service.js"

const { errorResponse, notFoundResponse } = responseHandler;

const userService = {
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
};

export default userService;
