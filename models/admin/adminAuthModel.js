import mongoose from "mongoose";

const adminSchema = new mongoose.Schema({
    userType: {
        type: String,
        default: 'admin'
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
    googleId: String,
},{ timestamps: true });



// Validation: Ensure at least one authentication method (password or googleId)
adminSchema.pre("save", function (next) {
    if (!this.password && !this.googleId) {
        return next(new Error("Either password or Google ID must be provided."));
    }
    next();
});


const adminAuthModel = mongoose.models.adminAuth || mongoose.model('adminAuth', adminSchema);

export default adminAuthModel;
