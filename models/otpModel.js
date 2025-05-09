import mongoose from "mongoose";


const otpSchema = new mongoose.Schema({
    userType: {
        type: String,
        enum: ['doctor', 'admin', 'user'],
        required: true
    },
    email: {
        type: String,
        required: true
    }, 
    otp: {
        type: String,
        required: true
    }, 
    createdAt: {
        type: Date,
        default: Date.now,
        expires: 300 // 5 minutes TTL
    }
})




const otpModel = mongoose.models.otpModel || mongoose.model('otpModel', otpSchema);


export {otpModel}