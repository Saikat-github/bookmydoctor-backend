import doctorModel from "../../models/doctor/doctorModel.js";
import appointmentModel from "../../models/appointmentModel.js";
import { uploadToCloudinary } from "../../config/cloudinary.js";
import doctorAuthModel from "../../models/doctor/doctorAuth.js";
import { createOrUpdateSubscription } from "../../utils/createOrUpdateSubscription.js";
import doctorPaymentModel from "../../models/doctor/doctorPayment.js";
import { applyPagination } from "../../utils/applyPagination.js";
import { deleteFromCloudinary } from "../../config/cloudinary.js";
import { sendProfileDeletionMail } from "../../utils/email.js";


//API to add doctor profile
const addDoctor = async (req, res) => {
    try {
        const { files, body } = req;

        // Validate required files
        if (!files.image || !files.licenseDocument) {
            return res.json({
                success: false,
                message: 'Both image and license document are required'
            });
        }

        if (body.maxAppointment > 100) {
            res.json({ success: false, message: "Max appointment can't be more than 100" })
        }

        // Helper function to upload files to Cloudinary
        const uploadFile = async (fileBuffer, folderPath) => {
            try {
                const result = await uploadToCloudinary(fileBuffer, folderPath);
                return { url: result.secure_url, public_id: result.public_id };
            } catch (error) {
                throw new Error(`Failed to upload to ${folderPath}: ${error.message}`);
            }
        };

        // Upload files to Cloudinary
        const [imageRes, licenseRes] = await Promise.all([
            uploadFile(files.image[0].buffer, 'doctors/images'),
            uploadFile(files.licenseDocument[0].buffer, 'doctors/licenses')
        ]);



        // Ensure email is provided
        if (!body.email) {
            return res.json({ success: false, message: "Email is required" });
        }

        // Check if a user with the same email already exists
        const existingDoctor = await doctorModel.findOne({ email: body.email });
        if (existingDoctor) {
            return res.json({ success: false, message: "profile is already created" });
        }



        // Create doctor record
        const newDoctor = new doctorModel({
            personalInfo: {
                name: body.name,
                email: body.email,
                image: imageRes.url,
                imagePublicId: imageRes.public_id,
                dob: body.dob,
                language: body.language
            },
            professionalInfo: {
                speciality: body.speciality,
                degree: body.degree,
                experience: body.experience,
                regNumber: body.regNumber,
                licenseDocument: licenseRes.url,
                licensePublicId: licenseRes.public_id
            },
            clinicInfo: {
                city: body.city,
                address: body.clinicAddress,
                pincode: body.pincode,
                phoneNumber: body.clinicPh,
                avgCheckTime: body.avgCheckTime,
                fees: body.fees,
                maxAppointment: body.maxAppointment
            },
            availability: {
                workingDays: JSON.parse(body.workingDays)
            },
            about: body.about,
            termsAndPolicy: body.termsAndPolicy,
            doctorId: body.docId
        });

        await newDoctor.save();
        await doctorAuthModel.findByIdAndUpdate(body.docId, { profileCompleted: true, profileId: newDoctor._id });

        res.json({
            success: true,
            message: 'Profile added successfully',
        });

    } catch (error) {
        console.error('Profile creation error:', error);
        res.json({
            success: false,
            message: error.message
        });
    }
};




//API to get doctor profile for doctor panel
const doctorProfile = async (req, res) => {
    try {
        const { docId } = req.query;
        const profileData = await doctorModel.findOne({ doctorId: docId });

        res.json({ success: true, profileData });
    } catch (error) {
        console.log(error);
        res.json({ success: false, message: error.message });
    }
}



//API to update doctor profile for doctor panel
const updateDoctorProfile = async (req, res) => {
    try {
        const { files, body } = req;
        const { docId } = body;
        const existingDoctor = await doctorModel.findOne({ doctorId: docId });

        if (!existingDoctor) {
            return res.json({ success: false, message: "Doctor not found" });
        }

        // Helper function to upload files to Cloudinary
        const uploadFile = async (fileBuffer, folderPath) => {
            try {
                const result = await uploadToCloudinary(fileBuffer, folderPath);
                return { url: result.secure_url, public_id: result.public_id };
            } catch (error) {
                throw new Error(`Failed to upload to ${folderPath}: ${error.message}`);
            }
        };


        let imageRes = "";
        let licenseRes = "";
        // Handle image upload
        if (files.image && files.image[0]) {
            imageRes = await uploadFile(files.image[0].buffer, 'doctors/images');
        }

        // Handle license document upload
        if (files.licenseDocument && files.licenseDocument[0]) {
            licenseRes = await uploadFile(files.licenseDocument[0].buffer, 'doctors/licenses');
        }


        // Create doctor record
        const newData = {
            personalInfo: {
                name: body.name || existingDoctor.personalInfo.name,
                email: body.email || existingDoctor.personalInfo.email,
                image: imageRes.url || existingDoctor.personalInfo.image,
                imagePublicId: imageRes.public_id || existingDoctor.personalInfo.imagePublicId,
                dob: body.dob || existingDoctor.personalInfo.dob,
                language: body.language || existingDoctor.personalInfo.language
            },
            professionalInfo: {
                speciality: body.speciality || existingDoctor.professionalInfo.speciality,
                degree: body.degree || existingDoctor.professionalInfo.degree,
                experience: body.experience || existingDoctor.professionalInfo.experience,
                regNumber: body.regNumber || existingDoctor.professionalInfo.regNumber,
                licenseDocument: licenseRes.url || existingDoctor.professionalInfo.licenseDocument,
                licensePublicId: licenseRes.public_id || existingDoctor.professionalInfo.licensePublicId
            },
            clinicInfo: {
                address: body.clinicAddress || existingDoctor.clinicInfo.address,
                phoneNumber: body.clinicPh || existingDoctor.clinicInfo.phoneNumber,
                avgCheckTime: body.avgCheckTime || existingDoctor.clinicInfo.avgCheckTime,
                fees: body.fees || existingDoctor.clinicInfo.fees,
                maxAppointment: body.maxAppointment || existingDoctor.clinicInfo.maxAppointment,
                pincode: body.pincode || existingDoctor.clinicInfo.pincode,
                city: body.city || existingDoctor.clinicInfo.city
            },
            availability: {
                workingDays: body.workingDays ? JSON.parse(body.workingDays) : existingDoctor.availability.workingDays
            },
            about: body.about || existingDoctor.about,
            termsAndPolicy: body.termsAndPolicy || existingDoctor.termsAndPolicy
        };

        const updatedDoctor = await doctorModel.findByIdAndUpdate(
            existingDoctor._id,
            newData,
            { new: true, runValidators: true }
        );

        res.json({
            success: true,
            message: 'Profile updated successfully',
            data: updatedDoctor
        });

    } catch (error) {
        console.log(error);
        res.json({ success: false, message: error.message });
    }
}




//API to change doctor availability
const changeAvailability = async (req, res) => {
    try {
        const { docId } = req.query;
        const docData = await doctorModel.findOne({ doctorId: docId });

        if (!docData) {
            return res.json({ success: false, message: "Doctor not found" });
        }

        await doctorModel.findByIdAndUpdate(docData._id, { availability: { ...docData.availability, isAvailable: !docData.availability.isAvailable } }, { new: true });

        res.json({ success: true, message: "Availability changed", isAvailable: !docData.availability.isAvailable });
    } catch (error) {
        console.log(error);
        res.json({ success: false, message: error.message })
    }
}




//API to get doctor appointments for doctor panel
const getAppointments = async (req, res) => {
    try {
        const { docId, date } = req.query;
        if (date) {
            const dateFormatRegex = /^\d{4}-\d{2}-\d{2}$/;
            if (!dateFormatRegex.test(date)) {
                return res.json({
                    success: false,
                    message: "Invalid date format. Please use YYYY-MM-DD format"
                });
            }
        }


        const doctor = await doctorAuthModel.findById(docId);;

        const query = { doctorId: doctor.profileId };

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
            .populate('allPatients');

        if (!appointments || appointments.length === 0) {
            return res.json({ success: false, message: "No Appointments" });
        }

        res.json({ success: true, appointments });
    } catch (error) {
        console.log(error);
        res.json({ success: false, message: error.message });
    }
}




const patientStats = async (req, res) => {
    try {
        const { docId, startDate, endDate } = req.query;

        // Basic input validation
        if (!startDate || !endDate) {
            return res.json({ success: false, message: "Start and End date are required." });
        }
        const startDateObj = new Date(startDate);
        const endDateObj = new Date(endDate);

        // Check if dates are valid
        if (isNaN(startDateObj.getTime()) || isNaN(endDateObj.getTime())) {
            return res.json({
                success: false,
                message: "Invalid date format. Please use YYYY-MM-DD or ISO 8601 format."
            });
        }

        // Compare dates
        if (startDateObj > endDateObj) {
            return res.json({
                success: false,
                message: "Start date should be less than or equal to end date."
            });
        }

        // Find doctor profile ID to filter appointments
        const doctor = await doctorAuthModel.findById(docId, 'profileId');
        if (!doctor) {
            return res.json({ success: false, message: "Doctor not found." });
        }

        // Find appointments within the date range for the specified doctor
        const appointmentsResult = await appointmentModel.find({
            doctorId: doctor.profileId,
            appointmentDate: {
                $gte: startDateObj,
                $lte: endDateObj
            }
        }).populate('allPatients');

        // Initialize statistics counters
        let totalPatients = 0;
        let verifiedPatients = 0;
        let nonVerifiedPatients = 0;
        let genderCount = {
            MALE: 0,
            FEMALE: 0,
            OTHER: 0
        };

        // Process each appointment and its patients
        appointmentsResult.forEach(appointment => {
            if (appointment.allPatients && Array.isArray(appointment.allPatients)) {
                appointment.allPatients.forEach(patient => {
                    totalPatients++;

                    // Count verified vs non-verified patients
                    if (patient.status === "VERIFIED") {
                        verifiedPatients++;
                    } else {
                        nonVerifiedPatients++;
                    }

                    // Count by gender
                    if (patient.gender) {
                        if (patient.gender === "MALE") {
                            genderCount.MALE++;
                        } else if (patient.gender === "FEMALE") {
                            genderCount.FEMALE++;
                        } else {
                            genderCount.OTHER++;
                        }
                    } else {
                        genderCount.OTHER++;
                    }
                });
            }
        });

        // Return the calculated stats
        return res.json({
            success: true,
            stats: {
                totalPatients,
                verifiedPatients,
                nonVerifiedPatients,
                genderStats: genderCount
            }
        });
    } catch (error) {
        console.error("Error fetching patient stats:", error.message, error.stack);
        return res.json({
            success: false,
            message: "Server error. Please try again later.",
            error: process.env.NODE_ENV === 'development' ? error.message : undefined
        });
    }
};



//API endPoint to get all payments details 
const getPayments = async (req, res) => {
    try {
        const { docId, cursor } = req.query;

        const doctor = await doctorModel.findOne({ doctorId: docId });

        if (!doctor) {
            return res.json({
                success: false,
                message: "Doctor profile, not found"
            })
        }

        let query = { doctorId: doctor._id, status: { $ne: "created" } };

        //Apply pagination
        const limit = 6;
        const { results, hasNextPage, nextCursor } = await applyPagination(query, doctorPaymentModel, limit, cursor);


        if (results.length === 0) {
            return res.json({
                success: false,
                message: "No payment details found!"
            })
        }

        res.json({
            success: true,
            payments: results,
            hasNextPage,
            nextCursor
        })
    } catch (error) {
        console.log(error);
        res.json({
            success: false,
            message: error.message
        })
    }
}



//Delete Doctor Profile
const deleteProfile = async (req, res) => {
    try {
        const { docId } = req.body;
        const docData = await doctorModel.findOne({ doctorId: docId });
        if (!docData) {
            return res.json({ success: false, message: "Doctor not found" });
        }

        const [result1, result2] = await Promise.all([
            deleteFromCloudinary(docData.personalInfo.imagePublicId),
            deleteFromCloudinary(docData.professionalInfo.licensePublicId)
        ]);

        if (result1.result === "ok" || result2.result === "ok") {
            await Promise.all([
                doctorPaymentModel.deleteMany({ doctorId: docData._id }),
                doctorModel.deleteOne({ _id: docData._id }),
                doctorAuthModel.findByIdAndUpdate(docId, { profileCompleted: false, profileId: null })
            ]);
            await sendProfileDeletionMail(docData.personalInfo.email, docData.personalInfo.name)
            return res.status(200).json({ success: true, message: "Profile Deleted" });
        } else {
            return res.status(500).json({ success: false, message: "Failed to delete images", result1, result2 });
        }

    } catch (error) {
        console.log(error);
        res.json({ success: false, message: error.message });
    }
}



export { addDoctor, changeAvailability, getAppointments, doctorProfile, updateDoctorProfile, deleteProfile, patientStats, getPayments };