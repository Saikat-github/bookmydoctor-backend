import { createSubscription, razorpayInstance, verifySubscription, verifyWebhookSignature } from "../../config/razorpay.js";
import doctorModel from "../../models/doctor/doctorModel.js";
import doctorPaymentModel from "../../models/doctor/doctorPayment.js";
import { createOrUpdateSubscription } from "../../utils/createOrUpdateSubscription.js";
// import { handlePaymentAuthorized, handlePaymentCaptured, handlePaymentFailed } from "../../services/webhookServices.js";



const createDocSubscription = async (req, res) => {
    try {
        const { doctorId, planType } = req.body;

        const doctor = await doctorModel.findById(doctorId);

        if (!doctor) {
            return res.json({
                success: false,
                message: "Doctor Profile Not Found!"
            })
        }

        let amount = planType === "monthly" ? 999 * 100 : 9999 * 100;
        const subscription = await createSubscription(amount, doctorId);

        res.json({
            success: true,
            subscription
        })
    } catch (error) {
        console.log(error);
        res.json({
            success: false,
            message: error.message
        })
    }
}



const verifyDocSubscription = async (req, res) => {
    try {
        const paymentDetails = req.body;
        const doctor = await doctorModel.findOne({ doctorId: paymentDetails.docId });

        const isVerified = verifySubscription(paymentDetails);
        if (!isVerified) {
            return res.json({
                success: false,
                message: "Payment verification failed, try again!"
            })
        }

        const orderInfo = await razorpayInstance.orders.fetch(paymentDetails.razorpay_order_id);
        const { amount, status } = orderInfo;

        let planType;
        if (amount/100 === 999) {
            planType = 'monthly'
        } else if (amount/100 === 9999) {
            planType = 'yearly'
        }


        const payment = await doctorPaymentModel.create({
            doctorId: doctor._id,
            orderId: paymentDetails.razorpay_order_id,
            paymentId: paymentDetails.razorpay_payment_id,
            amount: amount / 100,
            status,
            planType
        });


        if (status === "paid") {
            // Update subscription
            const updatedSubscription = await createOrUpdateSubscription(
                paymentDetails, planType, payment.amount
            );

            return res.status(200).json({
                success: true,
                message: `Successfully upgraded to ${updatedSubscription.plan} plan`,
                subscription: updatedSubscription
            });
        } else {
            res.json({ success: false, message: "Payment failed, see payment details on the payment page." });
        }

    } catch (error) {
        console.log(error);
        res.json({
            success: false,
            message: error.message
        })
    }
}



//Webhook Handler Function Will be implemented after application deployment as razorpay required an public url in the webhook configuration. I have made an in-depth notes on why and how to implement webhook in production grade application, reference to this application(bookmydoctor). Please see the referece. 

// const webhookHandler = async (req, res) => {
//     try {
//         const signature = req.headers['x-razorpay-signature'];
//         const body = req.body;

//         const isValidSignature = verifyWebhookSignature(signature, body);
//         if (!isValidSignature) {
//             return res.json({
//                 success: false,
//                 error: 'Invalid webhook signature'
//             });
//         }

//         const event = req.body.event;
//         const payload = req.body.payload;

//         // Handle different event types
//         switch (event) {
//             case 'payment.authorized':
//                 await handlePaymentAuthorized(payload.payment.entity);
//                 break;

//             case 'payment.captured':
//                 await handlePaymentCaptured(payload.payment.entity);
//                 break;

//             case 'payment.failed':
//                 await handlePaymentFailed(payload.payment.entity);
//                 break;

//             default:
//                 console.log(`Unhandled webhook event: ${event}`);
//         }

//         res.status(200).json({
//             success: true,
//             message: 'Webhook processed successfully'
//         });

//     } catch (error) {
//         console.error('Webhook processing error:', error);
//         // Still return 200 to prevent Razorpay from retrying
//         res.status(200).json({ received: true });
//     }
// }



export { createDocSubscription, verifyDocSubscription }