import passport from 'passport';
import { Strategy as GoogleStrategy } from 'passport-google-oauth20';
import { Strategy as LocalStrategy } from 'passport-local';
import bcrypt from 'bcrypt';
import doctorAuthModel from '../models/doctor/doctorAuth.js';
import adminAuthModel from '../models/admin/adminAuthModel.js';



// Helper function to find user in any model
const findUserById = async (id, userType) => {
  try {
    if (userType === 'doctor') {
      return await doctorAuthModel.findById(id);
    } else if (userType === 'admin') {
      return await adminAuthModel.findById(id);
    } else {
      return await userAuthModel.findById(id);
    }
  } catch (err) {
    return null;
  }
};

// Serialize with user type information
passport.serializeUser((user, done) => {
  done(null, { id: user._id, userType: user.userType });
});

// Deserialize using the appropriate model based on user type
passport.deserializeUser(async (data, done) => {
  try {
    const user = await findUserById(data.id, data.userType);
    done(null, user);
  } catch (err) {
    done(err, null);
  }
});

// Local Strategy for doctors
passport.use('doctor-local', new LocalStrategy(
  { usernameField: 'email' },
  async (email, password, done) => {
    try {
      const user = await doctorAuthModel.findOne({ email });

      if (!user) {
        return done(null, false, { message: 'Email does not exist!' });
      }

      const isMatch = await bcrypt.compare(password, user.password);
      if (!isMatch) {
        return done(null, false, { message: 'Incorrect password.' });
      }

      // Add user type for serialization
      user.userType = 'doctor';
      return done(null, user);
    } catch (err) {
      return done(err);
    }
  }
));

// // Local Strategy for regular users
// passport.use('user-local', new LocalStrategy(
//   { usernameField: 'email' },
//   async (email, password, done) => {
//     try {
//       const user = await userAuthModel.findOne({ email });

//       if (!user) {
//         return done(null, false, { message: 'Email does not exist!' });
//       }

//       const isMatch = await bcrypt.compare(password, user.password);
//       if (!isMatch) {
//         return done(null, false, { message: 'Incorrect password.' });
//       }

//       // Add user type for serialization
//       user.userType = 'user';
//       return done(null, user);
//     } catch (err) {
//       return done(err);
//     }
//   }
// ));




// Google Strategy for doctors
passport.use('doctor-google', new GoogleStrategy({
  clientID: process.env.GOOGLE_CLIENT_ID,
  clientSecret: process.env.GOOGLE_CLIENT_SECRET,
  callbackURL: `${process.env.BACKEND_URL}/api/doctor/google/callback`,
  proxy: true
},
  async (accessToken, refreshToken, profile, done) => {
    try {
      // Check if doctor already registered with email and password
      const registeredDoc = await doctorAuthModel.findOne({ email: profile.emails[0].value });
      if (registeredDoc && registeredDoc.password) {
        return done(null, false, { message: 'Email already registered with password!' });
      }
      // Check if doctor already exists
      const existingUser = await doctorAuthModel.findOne({ googleId: profile.id });

      if (existingUser) {
        existingUser.userType = 'doctor';
        return done(null, existingUser);
      }

      // If not, create new doctor
      const newUser = await new doctorAuthModel({
        googleId: profile.id,
        email: profile.emails[0].value,
        profileCompleted: false
      }).save();

      newUser.userType = 'doctor';
      done(null, newUser);
    } catch (err) {
      done(err, null);
    }
  }
));

// // Google Strategy for regular users
// passport.use('user-google', new GoogleStrategy({
//     clientID: process.env.GOOGLE_CLIENT_ID,
//     clientSecret: process.env.GOOGLE_CLIENT_SECRET,
//     callbackURL: `${process.env.BACKEND_URL}/api/user/google/callback`,
//     proxy: true
//   },
//   async (accessToken, refreshToken, profile, done) => {
//     try {
//       // Check if user already exists
//       const existingUser = await userAuthModel.findOne({ googleId: profile.id });

//       if (existingUser) {
//         existingUser.userType = 'user';
//         return done(null, existingUser);
//       }

//       // If not, create new user
//       const newUser = await new userAuthModel({
//         googleId: profile.id,
//         email: profile.emails[0].value,
//         profileCompleted: false
//       }).save();

//       newUser.userType = 'user';
//       done(null, newUser);
//     } catch (err) {
//       done(err, null);
//     }
//   }
// ));

// Google Strategy for admin
passport.use('admin-google', new GoogleStrategy({
  clientID: process.env.GOOGLE_CLIENT_ID,
  clientSecret: process.env.GOOGLE_CLIENT_SECRET,
  callbackURL: `${process.env.BACKEND_URL}/api/admin/google/callback`,
  proxy: true
},
  async (accessToken, refreshToken, profile, done) => {
    try {
      if (profile.emails[0].value !== process.env.ADMIN_EMAIL) {
        return done(null, false, { message: 'Unauthorized email!' });
      }
      // Check if admin already exists
      const existingUser = await adminAuthModel.findOne({ googleId: profile.id });

      if (existingUser) {
        existingUser.userType = 'admin';
        return done(null, existingUser);
      }

      // If not, create new admin
      const newUser = await new adminAuthModel({
        googleId: profile.id,
        email: profile.emails[0].value,
      }).save();

      newUser.userType = 'admin';
      done(null, newUser);
    } catch (err) {
      done(err, null);
    }
  }
));


export default passport;


















