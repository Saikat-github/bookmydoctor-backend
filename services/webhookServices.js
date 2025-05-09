import doctorPaymentModel from "../models/doctor/doctorPayment.js";
import doctorModel from "../models/doctor/doctorModel.js";
import { createOrUpdateSubsWebhook } from "../utils/createOrUpdateSubscription.js";


// Webhook handler functions
const handlePaymentAuthorized = async (payment) => {
    try {
        // Update payment record
        const updatedPayment = await doctorPaymentModel.findOneAndUpdate(
            { orderId: payment.order_id },
            {
                paymentId: payment.id,
                status: 'processing',
            },
            { new: true }
        );

        if (!updatedPayment) {
            console.log(`Payment record not found for order ID: ${payment.order_id}`);
            return;
        }

    } catch (error) {
        console.error('Error processing payment.authorized webhook:', error);
    }
};



const handlePaymentCaptured = async (payment) => {
    try {
        // Find and update payment record
        const updatedPayment = await doctorPaymentModel.findOneAndUpdate(
            { orderId: payment.order_id },
            {
                paymentId: payment.id,
                status: 'paid'
            },
            { new: true }
        );

        if (!updatedPayment) {
            console.log(`Payment record not found for order ID: ${payment.order_id}`);
            return;
        }

        // Update doctor's subscription status
        await createOrUpdateSubsWebhook(payment, updatedPayment.doctorId)
    } catch (error) {
        console.error('Error processing payment.captured webhook:', error);
    }
}



const handlePaymentFailed = async (payment) => {
    try {
        // Update payment record to failed
        const updatedPayment = await doctorPaymentModel.findOneAndUpdate(
            { orderId: payment.order_id },
            {
                paymentId: payment.id,
                status: 'failed'
            }
        );

        if (!updatedPayment) {
            console.log(`Payment record not found for order ID: ${payment.order_id}`);
            return;
          }

    } catch (error) {
        console.error('Error processing payment.failed webhook:', error);
    }
}



export { handlePaymentAuthorized, handlePaymentCaptured, handlePaymentFailed }