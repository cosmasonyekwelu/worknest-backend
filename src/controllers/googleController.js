import jwt from "jsonwebtoken";

export const googleAuth = async (req, res) => {
  const { token } = req.body;

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
      email,
      name,
      avatar: picture,
      provider: "google",
    });
  }

  // SIGN IN
  const appToken = jwt.sign({ userId: user._id }, process.env.JWT_SECRET, {
    expiresIn: "7d",
  });

  res.json({
    token: appToken,
    user,
  });
};
