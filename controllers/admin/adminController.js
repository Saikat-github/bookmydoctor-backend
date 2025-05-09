import doctorModel from '../../models/doctor/doctorModel.js';
import appointmentModel from '../../models/appointmentModel.js';
import doctorAuthModel from '../../models/doctor/doctorAuth.js';
import { applyPagination } from '../../utils/applyPagination.js';
import doctorPaymentModel from '../../models/doctor/doctorPayment.js';
import { deleteFromCloudinary } from '../../config/cloudinary.js';
import { sendAccountDeletionMail, sendProfileDeletionMail } from '../../utils/email.js';



//API to get dashboard data for admin panel 
const adminDashData = async (req, res) => {
    try {
        const { startDate, endDate } = req.query;
        let query = {};
        if (startDate && endDate) {
            // Validate date formats
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

            query = {
                createdAt: {
                    $gte: startDateObj,
                    $lte: endDateObj,
                },
            };
        }

        const [
            totalRegisteredDocs,
            totalProfiles,
            verifiedProfiles
        ] = await Promise.all([
            doctorAuthModel.countDocuments(query),
            doctorModel.countDocuments(query),
            doctorModel.countDocuments({ verified: true, ...query }),
        ]);

        const dashData = {
            totalRegisteredDocs,
            totalProfiles,
            verifiedProfiles,
            unverifiedProfiles: totalProfiles - verifiedProfiles,
        };

        res.json({ success: true, dashData });
    } catch (error) {
        console.log(error);
        res.json({ success: false, message: error.message });
    }
};




const allDocProfiles = async (req, res) => {
    try {
        const { name, startDate, endDate, cursor } = req.query;

        let query = {};
        if (startDate && endDate) {
            // Validate date formats
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

            query = {
                createdAt: {
                    $gte: startDateObj,
                    $lte: endDateObj,
                },
            };
        }

        if (name) query["personalInfo.name"] = new RegExp(name, 'i');

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



const allDocAccounts = async (req, res) => {
    try {
        const { search, startDate, endDate, cursor } = req.query;

        let query = {};
        if (startDate && endDate) {
            // Validate date formats
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

            query = {
                createdAt: {
                    $gte: startDateObj,
                    $lte: endDateObj,
                },
            };
        }

        if (search && search.trim() !== '') {
            query.email = new RegExp(search.trim(), 'i');
        }

        const limit = 15;
        const { results, hasNextPage, nextCursor } = await applyPagination(query, doctorAuthModel, limit, cursor);

        res.json({
            success: true,
            docAccounts: results,
            hasNextPage,
            nextCursor
        });
    } catch (error) {
        console.error("Error fetching doctors:", error);
        res.status(500).json({ success: false, message: "Some error occurred, please refresh the window" });
    }
};




//API to get top doctors by serials
const getTopDoctorsBySerials = async (req, res) => {
    try {
        let { startDate, endDate, bestPerforming, limit = 10 } = req.query;

        // Validate date formats
        const startDateObj = new Date(startDate);
        const endDateObj = new Date(endDate);

        // Check if dates are valid
        if (isNaN(startDateObj.getTime()) || isNaN(endDateObj.getTime())) {
            return res.json({
                success: false,
                message: "Invalid date format. Please use YYYY-MM-DD or ISO 8601 format."
            });
        }


        const sortDirection = bestPerforming === 'true' ? -1 : 1;
        const topDoctors = await appointmentModel.aggregate([
            {
                $match: {
                    appointmentDate: {
                        $gte: startDateObj,
                        $lte: endDateObj
                    }
                }
            },
            {
                $group: {
                    _id: '$doctorId',
                    totalSerials: { $sum: '$totalSerialNumber' }
                }
            },
            {
                $sort: { totalSerials: sortDirection }
            },
            {
                $limit: parseInt(limit)
            },
            {
                $lookup: {
                    from: 'doctors',
                    localField: '_id',
                    foreignField: '_id',
                    as: 'doctorInfo'
                }
            },
            {
                $unwind: '$doctorInfo'
            },
            {
                $project: {
                    _id: 0,
                    doctorId: '$doctorInfo._id',
                    name: '$doctorInfo.personalInfo.name',
                    specialization: '$doctorInfo.professionalInfo.speciality',
                    totalSerials: 1
                }
            }
        ]);

        res.json({ success: true, topDoctors });
    } catch (error) {
        res.json({ success: false, message: error.message, error });
    }
};



//API to get doctor profile for doctor panel
const getSingleDoctor = async (req, res) => {
    try {
        const { doctorId } = req.query;
        const profileData = await doctorModel.findById(doctorId);

        res.json({ success: true, profileData });
    } catch (error) {
        console.log(error);
        res.json({ success: false, message: error.message });
    }
}



//API to change doctor verification status
const changeVerificationStatus = async (req, res) => {
    try {
        const { docId } = req.body;
        const docData = await doctorModel.findById(docId)

        if(!docData) {
            return res.json({success: false, message: "Doctor not found!"});
        }

        await doctorModel.findByIdAndUpdate(docId, {verified: !docData.verified});
        res.json({success: true, message: "Availability changed"})
    } catch (error) {
        console.log(error);
        res.json({success: false, message: error.message})
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

        const query = { doctorId: docId};

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




//Delete doctor profile
const deleteDocProfile = async (req, res) => {
    try {
        const { docId } = req.body;
        const docData = await doctorModel.findById(docId)
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
                doctorAuthModel.findOneAndUpdate({ profileId: docId }, { profileCompleted: false, profileId: null })
            ]);
            await sendProfileDeletionMail(docData.personalInfo.email, docData.personalInfo.name)
            return res.json({ success: true, message: "Profile Deleted" });
        } else {
            return res.json({ success: false, message: "Failed to delete images", result1, result2 });
        }

    } catch (error) {
        console.log(error);
        res.json({ success: false, message: error.message });
    }
}



//API to delete doctor login account
const deleteDocAccount = async (req, res) => {
    try {
        const { docId } = req.body;
        if (!docId) {
            return res.status(400).json({ success: false, message: "docId is required" });
        }

        const docData = await doctorModel.findOne({ doctorId: docId });
        const docAuthData = await doctorAuthModel.findById(docId)

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
        res.status(200).json({ success: true, message: "Respected doctor's account and profile data deleted succesfully" });

    } catch (error) {
        console.log(error);
        res.json({ success: false, message: error.message });
    }
}


export { adminDashData, allDocProfiles, allDocAccounts, getTopDoctorsBySerials, getSingleDoctor, deleteDocProfile, deleteDocAccount, changeVerificationStatus, getAppointments };