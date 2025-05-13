import mongoose from 'mongoose';

const appointmentSchema = new mongoose.Schema({
    doctorId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Doctor',
        required: true
    },
    appointmentDate: {
        type: Date,
        required: true
    },
    currSerialNumber: {
        type: Number,
        default: 0
    },
    totalSerialNumber: {
        type: Number,
        default: 0
    },
    allPatients: [{
        type: mongoose.Schema.Types.ObjectId,
        ref: 'user'
    }]
}, {
    timestamps: true
});

// Compound index to ensure unique appointments per doctor per date
appointmentSchema.index({ doctorId: 1, appointmentDate: 1 }, { unique: true });



// This appointment will be automatically deleted 30 days later
appointmentSchema.index(
    { appointmentDate: 1 }, 
    { 
        expireAfterSeconds: 30 * 24 * 60 * 60,  // 30 days
        name: 'appointment_cleanup' 
    }
);



const appointmentModel = mongoose.models.appointment || mongoose.model('appointment', appointmentSchema);

export default appointmentModel;