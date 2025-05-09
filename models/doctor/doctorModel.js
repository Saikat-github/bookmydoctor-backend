import mongoose from 'mongoose';

const doctorSchema = new mongoose.Schema({
    // Personal Information
    personalInfo: {
        name: {
            type: String,
            required: true,
            trim: true
        },
        email: {
            type: String,
            required: true,
            unique: true,
            lowercase: true,
            match: [/^\w+([\.-]?\w+)*@\w+([\.-]?\w+)*(\.\w{2,3})+$/, 'Please fill a valid email address']
        },
        dob: {
            type: Date
        },
        language: {
            type: [String]
        },
        image: {
            type: String,
            required: true
        },
        imagePublicId: { type: String }
    },

    // Professional Information
    professionalInfo: {
        speciality: {
            type: String,
            required: true
        },
        degree: {
            type: String,
            required: true
        },
        experience: {
            type: String,
            required: true
        },
        regNumber: {
            type: String,
        },
        licenseDocument: {
            type: String
        },
        licensePublicId: { type: String }
    },

    // Clinic Information
    clinicInfo: {
        address: {
            type: String,
            required: true
        },
        city : {
            type: String,
            required: true
        },
        pincode: {
            type: Number,
            required: true,
            validate: {
                validator: function (v) {
                    return /^[1-9][0-9]{5}$/.test(v);
                },
                message: 'Invalid Indian pincode'
            }

        },
        phoneNumber: {
            type: String
        },
        avgCheckTime: {
            type: Number
        },
        fees: {
            type: Number,
            required: true,
            min: 0
        },
        maxAppointment: {
            type: Number
        }
    },

    // Availability and Scheduling
    availability: {
        workingDays: {
            type: Map,
            of: [
                {
                    start: {
                        type: String,
                        required: true,
                        validate: {
                            validator: v => /^([01]\d|2[0-3]):([0-5]\d)$/.test(v),
                            message: 'Invalid time format (HH:MM)'
                        }
                    },
                    end: {
                        type: String,
                        required: true,
                        validate: {
                            validator: function (v) {
                                // Check time format and ensure end time is after start
                                return /^([01]\d|2[0-3]):([0-5]\d)$/.test(v) &&
                                    new Date(`1970/01/01 ${v}`) > new Date(`1970/01/01 ${this.start}`);
                            },
                            message: 'End time must be after start time'
                        }
                    },
                },
            ],
            default: {}
        },
        isAvailable: {
            type: Boolean,
            default: true
        }
    },

    subscription: {
        status: {
            type: String,
            enum: ['trial', 'active', 'expired'],
            default: 'trial'
        },
        plan: {
            type: String,
            enum: ['free', 'monthly', 'yearly'],
            default: 'free'
        },
        startDate: {
            type: Date,
            default: Date.now
        },
        endDate: {
            type: Date,
            default: function () {
                // 14 days from now for trial
                const date = new Date();
                date.setDate(date.getDate() + 14);
                return date;
            }
        },
        orderId: {
            type: String
        },
        paymentId: {
            type: String
        }
    },

    // Additional Details
    about: {
        type: String
    },

    // Legal Compliance
    termsAndPolicy: {
        type: Boolean,
        required: true,
        validate: {
            validator: function (v) {
                return v === true;
            },
            message: 'Terms and Policy must be accepted'
        }
    },

    verified: {
        type: Boolean,
        default: false
    },

    // Metadata
    createdAt: {
        type: Date,
        default: Date.now
    },

    doctorId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'doctorAuth',
        default: null
    }, 

    reviews: {
        averageRating: {
            type: Number,
            default: 0,
            min: 0,
            max: 5,
            validate: {
                validator: Number.isFinite,
                message: 'Average rating must be a valid number'
            }
        },
        totalReviews: {
            type: Number,
            default: 0,
            min: 0,
            validate: {
                validator: Number.isInteger,
                message: 'Total reviews must be an integer'
            }
        }
    },

    blacklistedPatients: {
        type: [String],
        default: [],
        validate: {
            validator: function (phoneNumbers) {
                return phoneNumbers.every(
                    (num) => /^[6-9]\d{9}$/.test(num) // Basic phone number validation
                );
            },
            message: 'Invalid phone number format in blacklisted patients'
        }
    },
    
}, {
    minimize: false,
    timestamps: true
});



const doctorModel = mongoose.model('Doctor', doctorSchema);

// Compound index for faster searches
doctorSchema.index({ 'personalInfo.name': 1, 'clinicInfo.city': 1 });
doctorSchema.index({ 'professionalInfo.speciality': 1, 'clinicInfo.city': 1 });
doctorSchema.index({ 'clinicInfo.city': 1 });
doctorSchema.index({ doctorId: 1 })

export default doctorModel;
