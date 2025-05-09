import passport from 'passport';
import bcrypt from 'bcrypt';
import doctorAuthModel from '../../models/doctor/doctorAuth.js';
import { generateOTP, isValidEmail, sendAccountDeletionMail, sendOTPEmail, sendProfileDeletionMail } from '../../utils/email.js';
import axios from "axios";
import { otpModel } from '../../models/otpModel.js';
import doctorModel from '../../models/doctor/doctorModel.js';
import doctorPaymentModel from '../../models/doctor/doctorPayment.js';
import { deleteFromCloudinary } from '../../config/cloudinary.js';


const sendSignupOtp = async (req, res) => {
  try {
    const { email } = req.body;

    if (!email || !isValidEmail(email)) {
      return res.json({ success: false, message: 'Valid email required' })
    }

    const existingUser = await doctorAuthModel.findOne({ email });
    if (existingUser) {
      return res.json({ message: 'User already exists, please login' });
    }

    //Remove any existing OTPs for this email
    const otp = generateOTP();
    await otpModel.deleteMany({ email, userType: 'doctor' });

    //Create new OTP recored
    await otpModel.create({ email, otp, userType: 'doctor' });

    await sendOTPEmail(email, otp)

    res.json({ success: true, message: "OTP sent to your email" })
  } catch (error) {
    console.log(error);
    res.json({ success: false, message: 'Error sending OTP' });
  }
}



const verifyAndSignupOtp = async (req, res) => {
  try {
    const { email, password, otp, reCaptcha } = req.body;
    if (!email || !password || !otp) {
      return res.json({ success: false, message: "Please fill all fields" });
    }

    //Verifying OTP
    const otpRecord = await otpModel.findOne({ email, otp, userType: 'doctor' });
    if (!otpRecord) {
      return res.json({ success: false, message: "Invalid OTP" });
    }
    await otpModel.findByIdAndDelete(otpRecord._id);

    // Verifying reCaptcha
    if (!reCaptcha) {
      return res.json({ success: false, message: "Please verify the reCaptcha or refresh your page" })
    }
    const response = await axios.post(
      `https://www.google.com/recaptcha/api/siteverify?secret=${process.env.RECAPTCHA_DOCTOR_KEY}&response=${reCaptcha}`
    );
    if (!response.data.success || response.data.score < 0.5) {
      return res.json({ success: false, message: "Bot detected" });
    }


    //Registering new doctor
    const existingUser = await doctorAuthModel.findOne({ email });
    if (existingUser) {
      return res.json({ message: 'User already exists, please login' });
    }

    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);

    const newUser = new doctorAuthModel({
      email,
      password: hashedPassword,
      profileCompleted: false
    });

    await newUser.save();

    // Auto login after registration
    req.login(newUser, (err) => {
      if (err) {
        return res.json({ success: false, message: err.message })
      }
      res.json({ success: true, message: "SignUp successful" });
    });

  } catch (error) {
    res.json({ success: false, message: 'Server error, while signing up' });
  }
}




//Login API
const doctorLogin = (req, res, next) => {
  passport.authenticate('doctor-local', (err, user, info) => {
    if (err) {
      return res.json({ success: false, message: "Internal Server Error" });
    }
    if (!user) {
      return res.json({ success: false, message: info.message });
    }

    req.login(user, (err) => {
      if (err) {
        return res.json({ success: false, message: err.message });
      }
      return res.json({ success: true, message: "Login Successful" });
    });
  })(req, res, next); // Pass req, res, next explicitly to the authenticate function
};



//Google Login API
const doctorGoogleLogin = async (req, res) => {
  res.redirect(`${process.env.FRONTEND_URL}`);
};




//Logout API
const doctorLogout = async (req, res) => {
  try {
    req.logout((err) => {
      if (err) {
        return res.json({ success: false, message: err.message });
      }
    })
    res.json({ success: true, message: "Logged out successfully" });
  } catch (error) {
    console.log(error);
    res.json({ success: false, message: error.message });
  }
}




//Getting Current Doctor API
const getDoctor = async (req, res) => {
  try {
    // Return the user data, but ensure password and sensitive info are not exposed
    const { password, ...userData } = req.user.toObject();
    return res.json({ success: true, user: userData });
  } catch (error) {
    res.json({ success: false, message: error.message });
  }
}




// Forgot Password
const forgetPassword = async (req, res) => {
  try {
    const { email } = req.body;
    const user = await doctorAuthModel.findOne({ email });

    if (!user) {
      return res.json({ success: false, message: 'Email not found' });
    }

    if (user.googleId) {
      return res.json({
        success: false,
        message: 'This account uses Google authentication'
      });
    }

    // Check last OTP request time
    if (user.lastOTPRequestTime && (Date.now() - user.lastOTPRequestTime < 60000)) {
      return res.json({
        success: false,
        message: 'Please wait 1 minute before requesting another OTP'
      });
    }

    const otp = generateOTP();
    user.resetPasswordOTP = otp;
    user.resetPasswordOTPExpiry = new Date(Date.now() + 600000); // 10 minutes
    user.otpAttempts = 0;
    user.lastOTPRequestTime = new Date();

    await user.save();
    await sendOTPEmail(email, otp);

    res.json({ success: true, message: 'OTP sent to your email' });
  } catch (error) {
    console.log(error);
    res.json({ success: false, message: 'Error sending OTP' });
  }
}




// Verify OTP and Reset Password
const resetPassword = async (req, res) => {
  try {
    const { email, otp, newPassword } = req.body;
    const user = await doctorAuthModel.findOne({
      email,
      resetPasswordOTPExpiry: { $gt: Date.now() }
    });

    if (!user) {
      return res.json({ success: false, message: 'Invalid or expired OTP' });
    }

    // Check attempts
    if (user.otpAttempts >= 3) {
      return res.json({
        success: false,
        message: 'Too many invalid attempts. Please request a new OTP'
      });
    }

    // Verify OTP
    const isValidOTP = await bcrypt.compare(otp, user.resetPasswordOTP);
    if (!isValidOTP) {
      user.otpAttempts += 1;
      await user.save();
      return res.json({ success: false, message: 'Invalid OTP' });
    }

    // Reset password
    const salt = await bcrypt.genSalt(10);
    user.password = await bcrypt.hash(newPassword, salt);
    user.resetPasswordOTP = undefined;
    user.resetPasswordOTPExpiry = undefined;
    user.otpAttempts = 0;

    await user.save();

    res.json({ success: true, message: 'Password reset successful' });
  } catch (error) {
    console.log(error);
    res.json({ success: false, message: 'Error resetting password' });
  }
}



const deleteAccount = async (req, res) => {
  try {
    await req.logout((err) => {
      if (err) {
        return res.json({ success: false, message: err.message });
      }
    })

    const { docId } = req.body;
    if (!docId) {
      return res.status(400).json({ success: false, message: "docId is required" });
    }

    const docData = await doctorModel.findOne({ doctorId: docId });
    const docAuthData = await doctorAuthModel.findById(docId);

    if (docData) {
      const [result1, result2] = await Promise.all([
        deleteFromCloudinary(docData.personalInfo.imagePublicId),
        deleteFromCloudinary(docData.professionalInfo.licensePublicId)
      ]);
      if (result1.result === "ok" || result2.result === "ok") {
        await Promise.all([
          doctorPaymentModel.deleteMany({ doctorId: docData._id }),
          doctorModel.deleteOne({ _id: docData._id }),
        ]);
      } else {
        return res.status(500).json({ success: false, message: "Failed to delete images", result1, result2 });
      }
    }

    await doctorAuthModel.findByIdAndDelete(docId)
    await sendAccountDeletionMail(docAuthData.email)
    res.status(200).json({ success: true, message: "Your account and profile data deleted succesfully" });
  } catch (error) {
    console.log(error);
    res.json({ success: false, message: error.message });
  }
}

// const deleteAccount = async (req, res) => {
//   console.log("Deleting account...")
// }



export { sendSignupOtp, verifyAndSignupOtp, doctorLogin, doctorGoogleLogin, doctorLogout, getDoctor, forgetPassword, resetPassword, deleteAccount };
