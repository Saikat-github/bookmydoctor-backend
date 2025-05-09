import mongoose from "mongoose";
import bcrypt from "bcrypt";

const Schema = mongoose.Schema;

const doctorSchema = new Schema({
    userType: {
        type: String,
        default: 'doctor'
    },
    email: {
        type: String,
        required: true,
        unique: true,
        lowercase: true,
        match: [/^\w+([\.-]?\w+)*@\w+([\.-]?\w+)*(\.\w{2,3})+$/, 'Please fill a valid email address']
    },
    password: {
        type: String,
        required: function () {
            return !this.googleId; // Password required only for local auth
        }
    },
    name: String,
    googleId: String,
    createdAt: {
        type: Date,
        default: Date.now
    },
    profileCompleted: Boolean,
    profileId: {
        type: Schema.Types.ObjectId,
        ref: 'Doctor',
        default: null
    },
    resetPasswordOTP: String,
    resetPasswordOTPExpiry: Date,
    otpAttempts: { type: Number, default: 0 },
    lastOTPRequestTime: Date
});

// Hash OTP before saving
doctorSchema.pre('save', async function (next) {
    if (this.isModified('resetPasswordOTP') && this.resetPasswordOTP) {
        this.resetPasswordOTP = await bcrypt.hash(this.resetPasswordOTP, 10);
    }
    next();
}, {
    timestamps: true
});


// Validation: Ensure at least one authentication method (password or googleId)
doctorSchema.pre("save", function (next) {
    if (!this.password && !this.googleId) {
        return next(new Error("Either password or Google ID must be provided."));
    }
    next();
});


const doctorAuthModel = mongoose.models.doctorAuth || mongoose.model('doctorAuth', doctorSchema);

export default doctorAuthModel;