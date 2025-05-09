import express from 'express';
import { bookAppointment } from '../controllers/appointmentController.js';
import { doctorsList, getRealTimeData, searchDoctors, sendAuthOTP, sendEmailWithQR } from '../controllers/userController.js';
import { validateInputs } from '../middlewares/inputvalidation/validateInput.js';
import { getQRvalidation, validateBookAppointment, validateSearchDoctors, verifyOTPvalidation } from '../middlewares/inputvalidation/uservalidation.js';
import { sendUserOtpLimiter } from '../middlewares/rateLimit.js';


const userRouter = express.Router();


userRouter.get("/search-doctors",validateInputs(validateSearchDoctors), searchDoctors);
userRouter.get("/all-doctors", doctorsList)
userRouter.post("/book-appointment", validateInputs(validateBookAppointment), bookAppointment);
userRouter.get("/realtimestatus", getRealTimeData);
userRouter.post("/get-otp", sendUserOtpLimiter, validateInputs(getQRvalidation), sendAuthOTP)
userRouter.post("/get-qrcode", sendUserOtpLimiter, validateInputs(verifyOTPvalidation), sendEmailWithQR)



// userRouter.post("/register", registerUser);
// userRouter.post('/login', loginUser);
// userRouter.get('/getuser',authUser, getUser);
// userRouter.post('/updateuser', authUser, updateUser);
// userRouter.get("/list-appointments", authUser, listAppoinment);
// userRouter.post("/cancel-appointment", authUser, cancelAppointment);
// userRouter.post("/payment-razorpay", authUser, paymentRazorpay)
// userRouter.post("/verify-razorpay", authUser, verifyPayment);


export default userRouter;