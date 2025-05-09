import mongoose from "mongoose";

const Schema = mongoose.Schema;

const paymentSchema = new Schema({
    doctorId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Doctor',
        required: true
    },
    orderId:
    {
        type: String,
        required: true
    },
    paymentId: {
        type: String
    },
    amount: {
        type: Number,
        required: true
    },
    currency: {
        type: String,
        default: 'INR'
    },
    status: {
        type: String,
        default: 'created'
    },
    details : {
        type: String,
        default: "Subscription Payment"
    },
    planType: {
        type: String,
        enum: ['monthly', 'yearly'],
      },

}, { timestamps: true })



paymentSchema.index({ doctorId: 1, status: 1 });

const doctorPaymentModel = mongoose.model('doctorPayment', paymentSchema);

export default doctorPaymentModel;