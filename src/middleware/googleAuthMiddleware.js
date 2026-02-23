import passport from "passport";
import GoogleStrategy from "passport-google-oauth20";
import User from "../models/user.js";

const googlePassportMiddleware = () => {
  passport.use(
    new GoogleStrategy(
      {
        clientID: process.env.GOOGLE_CLIENT_ID,
        clientSecret: process.env.GOOGLE_CLIENT_SECRET,
        callbackURL: `${process.env.WORKNEST_BASE_URL}/auth/google/callback`,
      },
      async (accessToken, refreshToken, profile, done) => {
        try {
          let user = await User.findOne({ googleId: profile.id });

          if (!user) {
            user = await User.create({
              googleId: profile.id,
              fullname: profile.displayName,
              email: profile.emails[0].value,
              avatar: profile.photos?.[0]?.value,
              provider: "google",
            });
          }

          return done(null, user);
        } catch (error) {
          return done(error, null);
        }
      },
    ),
  );

  // ================================
  // ✅ Serialize + Deserialize
  // ================================
  passport.serializeUser((user, done) => {
    done(null, user.id);
  });

  passport.deserializeUser(async (id, done) => {
    try {
      const user = await User.findById(id);
      done(null, user);
    } catch (err) {
      done(err, null);
    }
  });
};

export default googlePassportMiddleware;
