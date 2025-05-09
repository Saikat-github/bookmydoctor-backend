import Razorpay from 'razorpay';
import crypto from 'crypto';


const razorpayInstance = new Razorpay({
  key_id: process.env.RAZORPAY_KEY_ID,
  key_secret: process.env.RAZORPAY_KEY_SECRET
});



//function to create subscription
const createSubscription = async (amount, id) => {
  try {
    const subscription = await razorpayInstance.orders.create({
      amount,
      currency: "INR",
      receipt: `rcpt_${id.slice(0, 10)}_${Date.now()}`
    })


    return subscription;
  } catch (err) {
    console.log(err)
      `Error creating Razorpay subscription: ${err.error?.description || err.message || err}`
  }
}



//function to verify subscription payment signature
const verifySubscription = (paymentDetails) => {
  const { razorpay_order_id, razorpay_payment_id, razorpay_signature } = paymentDetails;

  const generatedSignature = crypto
  .createHmac('sha256', process.env.RAZORPAY_KEY_SECRET)
  .update(`${razorpay_order_id}|${razorpay_payment_id}`)
  .digest('hex');


  return generatedSignature === razorpay_signature;
}



const verifyWebhookSignature = (razorpaySignature, webhookBody) => {

  const expectedSignature = crypto
  .createHmac('sha256', process.env.RAZORPAY_WEBHOOK_SECRET)
  .update(JSON.stringify(webhookBody))
  .digest('hex');

  return expectedSignature === razorpaySignature;
}

export { razorpayInstance, createSubscription, verifySubscription, verifyWebhookSignature };
