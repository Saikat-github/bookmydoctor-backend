import { v4 as uuidv4 } from 'uuid';
import crypto from 'crypto';
import userModel from '../models/userModel.js';
import appointmentModel from '../models/appointmentModel.js';
import doctorModel from '../models/doctor/doctorModel.js';
import mongoose from "mongoose";
import doctorAuthModel from '../models/doctor/doctorAuth.js';
import axios from 'axios'




// Helper functions
const generateVerificationHash = (appointmentId, patientName, appointmentDate) => {
    return crypto
        .createHash('sha256')
        .update(`${appointmentId}-${patientName}-${appointmentDate}`)
        .digest('hex');
};

const generateQRCodeData = (appointmentId, patientName, doctorId, appointmentDate, verificationHash, doctorName,
    serialNumber) => {
    return JSON.stringify({
        appointmentId,
        patientName,
        doctorId,
        appointmentDate,
        verificationHash,
        doctorName,
        serialNumber
    });
};



// Book Appointment
const bookAppointment = async (req, res) => {
    const session = await mongoose.startSession();
    session.startTransaction();

    try {
        const { patientName, gender, phoneNumber, doctorId, appointmentDate, email, reCaptcha, honeypot } = req.body;

        if (honeypot) {
            return res.json({success: false, message: "Bot detected, can't book appointment"})
        }

        const response = await axios.post(
            `https://www.google.com/recaptcha/api/siteverify?secret=${process.env.RECAPTCHA_USER_KEY}&response=${reCaptcha}`
          );
      
          if (!response.data.success || response.data.score < 0.4) {
            return res.json({ success: false, message: "Bot detected" });
          }

        // Validate input
        if (!patientName || !gender || !phoneNumber || !doctorId || !appointmentDate) {
            return res.json({ success: false, message: "Missing required fields" });
        }

        const normalizedGender = gender.toUpperCase();

        // Find doctor and check availability
        const doctor = await doctorModel.findById(doctorId).session(session);
        const doctorName = doctor.personalInfo.name;
        const doctorSpeciality = doctor.professionalInfo.speciality;

        if (!doctor || doctor.availability.isAvailable === false) {
            await session.abortTransaction();
            return res.json({ success: false, message: "Doctor is not available" });
        }

        // Ensure unique booking for the same patient on the same date
        const existingUser = await userModel.findOne({ phoneNumber, appointmentDate, doctorId }).session(session);
        if (existingUser) {
            await session.abortTransaction();
            return res.json({ success: false, message: "You already have an appointment for this date" });
        }

        // Find or create appointment entry & get serial number atomically
        const updatedAppointment = await appointmentModel.findOneAndUpdate(
            { doctorId, appointmentDate },
            { $inc: { totalSerialNumber: 1 } },
            { upsert: true, new: true, session }
        );

        const serialNumber = updatedAppointment.totalSerialNumber;

        // Check if max appointment limit is reached
        if (serialNumber > doctor.clinicInfo.maxAppointment) {
            await session.abortTransaction();
            return res.json({ success: false, message: "Booking full, choose another date" });
        }

        // Generate appointment ID, QR Code & Hash
        const appointmentId = uuidv4();
        const verificationHash = generateVerificationHash(appointmentId, patientName, appointmentDate);
        const qrCodeData = generateQRCodeData(appointmentId, patientName, doctorId, appointmentDate, verificationHash, doctorName,
            serialNumber);

        // Create user appointment
        const newUser = await userModel.create([{
            patientName,
            gender: normalizedGender,
            phoneNumber,
            doctorId,
            appointmentDate,
            qrCodeData,
            verificationHash,
            serialNumber,
            doctorSpeciality,
            email
        }], { session });

        // Add patient to the appointment list
        await appointmentModel.findByIdAndUpdate(
            updatedAppointment._id,
            { $push: { allPatients: newUser[0]._id } },
            { session }
        );

        // Commit the transaction
        await session.commitTransaction();
        session.endSession();

        return res.json({
            success: true,
            message: "Appointment booked successfully",
            qrCodeData
        });

    } catch (error) {
        await session.abortTransaction();
        session.endSession();
        console.error("Booking appointment failed:", error);
        return res.json({ success: false, message: "Internal server error while booking appointment" });
    }
};




// Verify Appointment
const verifyAppointment = async (req, res) => {
    try {
        const { qrCodeData, docId } = req.body;


        if (!qrCodeData) {
            return res.json({
                success: false,
                message: 'QR code data is required'
            });
        }


        const parsedData = JSON.parse(qrCodeData);

        // Verify appointment date and today is same
        //Commenting out it for now to test the verification
        // const today = new Date();
        // if (today.getDate() !== new Date(parsedData.appointmentDate).getDate()) {
        //     return res.json({
        //         success: false,
        //         message: `Appointment can only be verified on the appointment date ${parsedData.appointmentDate.split("-").reverse().join("-")}`
        //     });
        // }


        const patient = await userModel.findOne({ qrCodeData });
        const doctor = await doctorAuthModel.findById(docId);

        if (!patient) {
            return res.json({
                success: false,
                message: 'Appointment not found'
            });
        }

        if (!doctor) {
            return res.json({
                success:false,
                message: "Doctor profile not found, please add or update your profile"
            })
        }
        //Verify Doctor
        if (doctor.profileId.toString() !== parsedData.doctorId) {
            return res.json({
                success: false,
                message: "You don't have permission to verify this appointment"
            })
        }


        // Verify hash
        const regeneratedHash = generateVerificationHash(
            parsedData.appointmentId,
            parsedData.patientName,
            parsedData.appointmentDate
        );

        if (regeneratedHash !== parsedData.verificationHash) {
            return res.json({
                success: false,
                message: 'Invalid verification hash'
            });
        }


        // Verify appointment status
        if (patient.status === 'VERIFIED') {
            return res.json({
                success: true,
                message: 'Patient Already Verified, Details Below',
                patientDetails: patient
            });
        }


        // Create start and end of day for the appointment date
        const appointmentDate = new Date(parsedData.appointmentDate);
        const startOfDay = new Date(appointmentDate.setHours(0, 0, 0, 0));
        const endOfDay = new Date(appointmentDate.setHours(23, 59, 59, 999));

        // Update appointment with date range query
        const appointmentUpdate = await appointmentModel.findOneAndUpdate(
            {
                doctorId: parsedData.doctorId,
                appointmentDate: {
                    $gte: startOfDay,
                    $lte: endOfDay
                }
            },
            {
                currSerialNumber: parsedData.serialNumber
            },
            {
                new: true
            }
        );


        if (!appointmentUpdate) {
            return res.json({
                success: false,
                message: 'Could not find matching appointment for update'
            });
        }

        // Update appointment status in userModel
        await userModel.findByIdAndUpdate(patient._id, {
            status: 'VERIFIED'
        });


        // Get io from the express app
        const io = req.app.get('io');
        // console.log(`doctor-${parsedData.doctorId}+${parsedData.appointmentDate}`);
        
        // Emit to all clients in this doctor's room
        io.to(`doctor-${parsedData.doctorId}+${parsedData.appointmentDate}`).emit('current-patient-update', {
            totalSerialNumber: appointmentUpdate.totalSerialNumber,
            currSerialNumber: appointmentUpdate.currSerialNumber,
        });


        return res.status(200).json({
            success: true,
            message: 'Appointment Verified',
            patientDetails: patient
        });

    } catch (error) {
        console.error('Verifying appointment failed:', error);
        return res.json({
            success: false,
            message: 'Internal server error while verifying appointment'
        });
    }
};

export { bookAppointment, verifyAppointment };