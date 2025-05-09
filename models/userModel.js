import mongoose from "mongoose";
import bcrypt from 'bcrypt';

// User Schema (for patients)
const userSchema = new mongoose.Schema({
    patientName: {
        type: String,
        required: [true, 'Patient name is required'],
        trim: true,
        minlength: [2, 'Name must be at least 2 characters'],
        maxlength: [50, 'Name cannot exceed 50 characters']
    },
    gender: {
        type: String,
        required: [true, 'Gender is required'],
        enum: {
            values: ['MALE', 'FEMALE', 'OTHER'],
            message: 'Gender must be either MALE, FEMALE, or OTHER'
        },
        uppercase: true
    },
    phoneNumber: {
        type: String,
        required: [true, 'Phone number is required'],
        match: [/^[6-9]\d{9}$/, 'Please enter a valid phone number'],
    },
    doctorId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Doctor',
        required: [true, 'Doctor ID is required'],
    },
    appointmentDate: {
        type: Date,
        required: [true, 'Appointment date is required'],
    },
    serialNumber: {
        type: Number,
        required: [true, 'Serial number is required'],
        min: [1, 'Serial number must be positive']
    },
    status: {
        type: String,
        enum: {
            values: ['BOOKED', 'VERIFIED', 'CANCELLED'],
            message: 'Status must be either BOOKED, VERIFIED, or CANCELLED'
        },
        default: 'BOOKED',
    },
    qrCodeData: {
        type: String,
        required: [true, 'QR code data is required'],
    },
    verificationHash: {
        type: String,
        required: [true, 'Verification hash is required'],
        unique: true
    },
    doctorSpeciality: {
        type: String
    },
    email: {
        type: String,
        trim: true,
        lowercase: true,
        match: [
            /^[^\s@]+@[^\s@]+\.[^\s@]+$/,
            'Please enter a valid email address',
        ],
        // unique: true, // Uncomment if required
    },
    authOTP: String,
    authOTPExpiry: Date,
    otpAttempts: { type: Number, default: 0 },
    lastOTPRequestTime: Date,
    createdAt: { type: Date, default: Date.now },
});

// Compound indexes for common queries
userSchema.index({ doctorId: 1, appointmentDate: 1 });
userSchema.index({ phoneNumber: 1, appointmentDate: 1 });
userSchema.index({ email: 1, appointmentDate: 1 });

// This patient will be automatically deleted 60 days later
userSchema.index(
    { appointmentDate: 1 },
    {
        expireAfterSeconds: 60 * 24 * 60 * 60,  // 60 days
        name: 'appointment_cleanup'
    }
);


// Hash OTP before saving
userSchema.pre('save', async function (next) {
    if (this.isModified('authOTP') && this.authOTP) {
        this.authOTP = await bcrypt.hash(this.authOTP, 10);
    }
    next();
});


const userModel = mongoose.models.user || mongoose.model('user', userSchema);

export default userModel;





























