import passport from "passport";
import { Strategy as GoogleStrategy } from "passport-google-oauth2";
import { Strategy as FacebookStrategy } from "passport-facebook";
passport.use(
  new GoogleStrategy(
    {
      clientID: process.env.GOOGLE_CLIENT_ID,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET,
      callbackURL: "http://localhost:3000/api/v1/auth/google/callback",
      passReqToCallback: true,
    },
    function (request, accessToken, refreshToken, profile, done) {
      return done(null, profile);
    },
  ),
);
passport.use(
  new FacebookStrategy(
    {
      clientID: process.env.FACEBOOK_APP_ID || "placeholder_id",
      clientSecret: process.env.FACEBOOK_APP_SECRET || "placeholder_secret",
      callbackURL: "http://localhost:3000/api/v1/auth/facebook/callback",
      profileFields: ["id", "displayName", "emails", "name"],
    },
    function (accessToken, refreshToken, profile, done) {
      return done(null, profile);
    },
  ),
);
