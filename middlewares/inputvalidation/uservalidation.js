import { body, param, query } from 'express-validator';


// Book Appointment Validation Middleware - Based on controller function
const validateBookAppointment = [
    body('patientName')
        .isString().withMessage('Patient name must be a string')
        .trim()
        .isLength({ min: 2, max: 100 }).withMessage('Patient name must be between 2 and 100 characters')
        .notEmpty().withMessage('Patient name is required'),

    body('gender')
        .isString().withMessage('Gender must be a string')
        .trim()
        .isIn(['MALE', 'FEMALE', 'OTHER', 'male', 'female', 'other']).withMessage('Gender must be MALE, FEMALE or OTHER')
        .notEmpty().withMessage('Gender is required'),

    body('phoneNumber')
        .isString().withMessage('Phone number must be a string')
        .matches(/^\+?[0-9]{10,15}$/).withMessage('Invalid phone number format')
        .notEmpty().withMessage('Phone number is required'),

    body('doctorId')
        .isMongoId().withMessage('Invalid doctor ID format')
        .notEmpty().withMessage('Doctor ID is required'),

    body('appointmentDate')
        .isISO8601().withMessage('Invalid date format - use ISO format (YYYY-MM-DD)')
        .custom(value => {
            const date = new Date(value);
            const now = new Date();
            if (date < now.setHours(0, 0, 0, 0)) {
                throw new Error('Appointment date cannot be in the past');
            }
            return true;
        })
        .notEmpty().withMessage('Appointment date is required')
];



// Verify Appointment Validation Middleware - Based on controller function
const validateVerifyAppointment = [
    body('qrCodeData')
        .isString().withMessage('QR code data must be a string')
        .notEmpty().withMessage('QR code data is required')
        .custom(value => {
            try {
                const parsed = JSON.parse(value);
                if (!parsed.appointmentId || !parsed.patientName || !parsed.doctorId ||
                    !parsed.appointmentDate || !parsed.verificationHash ||
                    !parsed.doctorName || !parsed.serialNumber) {
                    throw new Error('Invalid QR code data format');
                }
                return true;
            } catch (error) {
                throw new Error('Invalid JSON format in QR code data');
            }
        }),

    body('docId')
        .isMongoId().withMessage('Invalid doctor ID format')
        .notEmpty().withMessage('Doctor ID is required')
];



const validateSearchDoctors = [
    query('name')
        .optional({ checkFalsy: true })
        .isString().withMessage('Name must be a string')
        .trim()
        .isLength({ min: 1, max: 100 }).withMessage('Name must be between 2 and 50 characters')
        .matches(/^[a-zA-Z\s]*$/).withMessage('Name can only contain letters and spaces'),

    query('city')
        .optional({ checkFalsy: true })
        .isString().withMessage('City must be a string')
        .trim()
        .isLength({ min: 1, max: 100 }).withMessage('City must be between 2 and 50 characters')
        .matches(/^[a-zA-Z\s]*$/).withMessage('City can only contain letters and spaces'),


    // Custom validator to ensure at least one search parameter is provided
    query().custom((value) => {
        if (!value.name && !value.city) {
            throw new Error('Please provide either a name or city');
        }
        return true;
    })
];


const getQRvalidation = [
    body('email').isEmail().withMessage('Please provide a valid email')
];


const verifyOTPvalidation = [
    body('email').isEmail().withMessage('Please provide a valid email'),
    body('otp').isNumeric().isLength({ min: 6, max: 6 }).withMessage('OTP must be 6 digits')
];



export { validateBookAppointment, validateVerifyAppointment, validateSearchDoctors, getQRvalidation, verifyOTPvalidation };