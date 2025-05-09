import express from 'express';
import {
  addDoctor, getAppointments, doctorProfile, updateDoctorProfile, changeAvailability, deleteProfile, patientStats, getPayments,

} from '../controllers/doctor/doctorController.js';
import authDoctor from '../middlewares/authDoctor.js';
import passport from 'passport'
import { deleteAccount, doctorGoogleLogin, doctorLogin, doctorLogout, forgetPassword, getDoctor, resetPassword, sendSignupOtp, verifyAndSignupOtp } from '../controllers/doctor/doctorAuth.js';
import { validateInputs } from '../middlewares/inputvalidation/validateInput.js';
import uploadDoctorFiles from '../middlewares/multer.js';
import { loginLimiter, paymentRequestLimiter, sendDocOtpLimiter } from '../middlewares/rateLimit.js';
import {
  registerValidation,
  loginValidation,
  forgotPasswordValidation,
  resetPasswordValidation,
  changeAvailabilityValidation,
  deleteProfileValidation
} from '../middlewares/inputvalidation/doctorValidation.js';
import { checkSubscription } from '../middlewares/checkSubscription.js';
import { createDocSubscription, verifyDocSubscription } from '../controllers/doctor/doctorPayment.js';
import { validateVerifyAppointment } from '../middlewares/inputvalidation/uservalidation.js';
import { verifyAppointment } from '../controllers/appointmentController.js'



const doctorRouter = express.Router();



//Google Login
// Redirect to Google OAuth
doctorRouter.get('/google', passport.authenticate('doctor-google', { scope: ['profile', 'email'] }));
// Google OAuth callback
doctorRouter.get(
  '/google/callback',
  passport.authenticate('doctor-google', {
    failureRedirect: `${process.env.FRONTEND_URL}/login?message=can't_use_this_account`,
  }), doctorGoogleLogin
);
//Normal Passport Authentication
doctorRouter.post("/sendotp-signup", sendDocOtpLimiter, sendSignupOtp);
doctorRouter.post("/register", loginLimiter, validateInputs(registerValidation), verifyAndSignupOtp);
doctorRouter.post("/login", loginLimiter, validateInputs(loginValidation), doctorLogin);
doctorRouter.get('/logout', doctorLogout);
doctorRouter.get('/current_user', authDoctor, getDoctor);
doctorRouter.post('/forgot-password', sendDocOtpLimiter, validateInputs(forgotPasswordValidation), forgetPassword);
doctorRouter.post('/reset-password', validateInputs(resetPasswordValidation), resetPassword);
doctorRouter.delete("/delete-account", authDoctor, validateInputs(deleteProfileValidation), deleteAccount)


//Other Routes
doctorRouter.post("/add-doctor", uploadDoctorFiles, authDoctor, addDoctor);
doctorRouter.get("/profile", authDoctor, doctorProfile);
doctorRouter.get("/change-availability", authDoctor, checkSubscription, validateInputs(changeAvailabilityValidation), changeAvailability);
doctorRouter.post("/update-profile", uploadDoctorFiles, authDoctor, updateDoctorProfile);
doctorRouter.delete("/delete-profile", authDoctor, validateInputs(deleteProfileValidation), deleteProfile);
doctorRouter.get("/get-appointments", authDoctor, checkSubscription, getAppointments);
doctorRouter.get("/patient-stats", authDoctor, checkSubscription, patientStats);
doctorRouter.post("/verify-appointment", authDoctor, checkSubscription, validateInputs(validateVerifyAppointment), verifyAppointment)

//Payment Routes
doctorRouter.post("/create-subscription", authDoctor, paymentRequestLimiter, createDocSubscription);
doctorRouter.post("/verify-subscription", authDoctor, verifyDocSubscription);
doctorRouter.get("/payment-allpayments", authDoctor, getPayments);




export default doctorRouter;