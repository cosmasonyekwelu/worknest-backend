import jwt from "jsonwebtoken";
import { OAuth2Client } from "google-auth-library";
import User from "../models/user.js";

const client = new OAuth2Client(process.env.GOOGLE_CLIENT_ID);

export const googleAuth = async (req, res) => {
  try {
    const { token } = req.body;

    if (!token) {
      return res.status(400).json({ message: "Missing Google ID token" });
    }

    const ticket = await client.verifyIdToken({
      idToken: token,
      audience: process.env.GOOGLE_CLIENT_ID,
    });

    const payload = ticket.getPayload();
    const { sub, email, name, picture } = payload;

    let user = await User.findOne({ email });

    if (!user) {
      // SIGN UP
      user = await User.create({
        googleId: sub,
        fullname: name,
        email,
        avatar: picture,
        provider: "google",
      });
    }

    // SIGN IN
    const appToken = jwt.sign({ userId: user._id }, process.env.JWT_SECRET, {
      expiresIn: "7d",
    });

    return res.json({ token: appToken, user });
  } catch (error) {
    console.error("Google auth error:", error);
    return res.status(500).json({ message: "Google authentication failed" });
  }
};
