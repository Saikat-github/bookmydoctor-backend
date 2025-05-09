import doctorModel from "../models/doctor/doctorModel.js";
import appointmentModel from "../models/appointmentModel.js";
import userModel from "../models/userModel.js";
import { generateOTP, sendOTPEmail } from "../utils/email.js";
import { sendEmailWithQRCodeFile } from "../utils/sendEmailQR.js";
import bcrypt from 'bcrypt';
import { applyPagination } from "../utils/applyPagination.js";



// API to get all doctors with cursor-based pagination
const doctorsList = async (req, res) => {
    try {
        const { speciality, city, cursor } = req.query;

        const query = {};
        if (speciality) query["professionalInfo.speciality"] = new RegExp(speciality, 'i');
        if (city) query["clinicInfo.city"] = new RegExp(city, 'i');


        const limit = 15;
        const { results, hasNextPage, nextCursor } = await applyPagination(query, doctorModel, limit, cursor);

        res.json({
            success: true,
            doctors: results,
            hasNextPage,
            nextCursor
        });
    } catch (error) {
        console.error("Error fetching doctors:", error);
        res.status(500).json({ success: false, message: "Some error occurred, please refresh the window" });
    }
};




//API to search doctors based on name or pincode
const searchDoctors = async (req, res) => {
    try {
        const { name, city, cursor } = req.query;

        // Validate input
        if (!name && !city) {
            return res.json({ success: false, message: "Please provide a doctor's name or city/town" });
        }

        // Build query object directly
        const query = {};
        if (name) query["personalInfo.name"] = new RegExp(name, 'i');
        if (city) query["clinicInfo.city"] = new RegExp(city, 'i');

        // Apply pagination
        const limit = 15;
        const { results, hasNextPage, nextCursor } = await applyPagination(query, doctorModel, limit, cursor);

        if (results.length === 0) {
            return res.json({ success: false, message: "No doctors found!" });
        }

        res.json({
            success: true,
            doctors: results,
            hasNextPage,
            nextCursor
        });
    } catch (error) {
        console.log(error);
        res.json({ success: false, message: "Some error occurred while searching doctors, try again!" });
    }
};



//API to get doctor appointments for doctor panel
const getRealTimeData = async (req, res) => {
    try {
        const { doctorId, date } = req.query;

        if (!doctorId) {
            return res.json({ success: false, message: "Doctor ID is required" });
        }


        if (date) {
            const dateFormatRegex = /^\d{4}-\d{2}-\d{2}$/;
            if (!dateFormatRegex.test(date)) {
                return res.json({
                    success: false,
                    message: "Invalid date format. Please use YYYY-MM-DD format"
                });
            }
        }



        const query = { doctorId };

        if (date) {
            const startDate = new Date(date);
            startDate.setHours(0, 0, 0, 0);

            const endDate = new Date(date);
            endDate.setHours(23, 59, 59, 999);

            query.appointmentDate = {
                $gte: startDate,
                $lte: endDate
            };
        }

        const appointments = await appointmentModel
            .find(query)

        if (!appointments || appointments.length === 0) {
            return res.json({ success: false, message: "No Appointments" });
        }

        const { totalSerialNumber, currSerialNumber } = appointments[0]

        if (!appointments || appointments.length === 0) {
            return res.json({ success: false, message: "No Appointments" });
        }

        res.json({
            success: true, realTimeData: {
                totalSerialNumber,
                currSerialNumber
            }
        });
    } catch (error) {
        console.log(error);
        res.json({ success: false, message: error.message });
    }
}



// Send authentication otp to user email
const sendAuthOTP = async (req, res) => {
    try {
        const { email, doctorId, date } = req.body;

        if (!doctorId) {
            return res.json({ success: false, message: "Doctor is required" });
        }


        if (date) {
            const dateFormatRegex = /^\d{4}-\d{2}-\d{2}$/;
            if (!dateFormatRegex.test(date)) {
                return res.json({
                    success: false,
                    message: "Invalid date format. Please use YYYY-MM-DD format"
                });
            }
        }



        const query = { email, doctorId };

        if (date) {
            const startDate = new Date(date);
            startDate.setHours(0, 0, 0, 0);

            const endDate = new Date(date);
            endDate.setHours(23, 59, 59, 999);

            query.appointmentDate = {
                $gte: startDate,
                $lte: endDate
            };
        }

        const user = await userModel.findOne(query)

        if (!user) {
            return res.json({ success: false, message: 'Appointment not found' });
        }


        // Check last OTP request time
        if (user.lastOTPRequestTime && (Date.now() - user.lastOTPRequestTime < 60000)) {
            return res.json({
                success: false,
                message: 'Please wait 1 minute before requesting another OTP'
            });
        }

        const otp = generateOTP();
        user.authOTP = otp;
        user.authOTPExpiry = new Date(Date.now() + 600000); // 10 minutes
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



//Send QR to email
const sendEmailWithQR = async (req, res) => {
    try {
        const { email, otp } = req.body;
        const user = await userModel.findOne({
            email,
            authOTPExpiry: { $gt: Date.now() }
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
        const isValidOTP = await bcrypt.compare(otp, user.authOTP);
        if (!isValidOTP) {
            user.otpAttempts += 1;
            await user.save();
            return res.json({ success: false, message: 'Invalid OTP' });
        }

        // Reset password
        sendEmailWithQRCodeFile(email, user.qrCodeData);
        user.authOTP = undefined;
        user.authOTPExpiry = undefined;
        user.otpAttempts = 0;

        await user.save();

        res.json({ success: true, message: 'Your QR code is sent to you email, please check.' });
    } catch (error) {
        console.log(error);
        res.json({ success: false, message: 'Error resetting password' });
    }
}



export { searchDoctors, getRealTimeData, sendAuthOTP, sendEmailWithQR, doctorsList };



