import doctorModel from "../models/doctor/doctorModel.js";
import { sendSubscriptionActivateEmail } from "./email.js";


// CreateOrUpdateSubscription
//Normal Version for order creation
export const createOrUpdateSubscription = async (paymentDetails, planType = "monthly", amount) => {
  try {
    const { razorpay_order_id, razorpay_payment_id, docId } = paymentDetails;
    const doctor = await doctorModel.findOne({ doctorId: docId })

    if (!doctor) {
      throw new Error("Doctor Not Found!");
    }

    // Get current date
    const now = new Date();

    // Set new end date based on plan type
    let endDate = new Date();
    if (planType === 'monthly') {
      endDate.setMonth(endDate.getMonth() + 1);
    } else if (planType === 'yearly') {
      endDate.setFullYear(endDate.getFullYear() + 1);
    }

    // If subscription hasn't expired yet, extend from current end date
    if (doctor.subscription.status !== 'expired' && doctor.subscription.endDate > now) {
      endDate = new Date(doctor.subscription.endDate);
      if (planType === 'monthly') {
        endDate.setMonth(endDate.getMonth() + 1);
      } else if (planType === 'yearly') {
        endDate.setFullYear(endDate.getFullYear() + 1);
      }
    }


    // Update subscription details
    const updatedDoctor = await doctorModel.findByIdAndUpdate(
      doctor._id,
      {
        $set: {
          'subscription.status': 'active',
          'subscription.plan': planType,
          'subscription.endDate': endDate,
          'subscription.startDate': now,
          'subscription.paymentId': razorpay_payment_id,
          'subscription.orderId': razorpay_order_id,
          'availability.isAvailable': true
        }
      },
      { new: true, runValidators: true }
    );

    await sendSubscriptionActivateEmail(doctor.personalInfo.email, endDate, planType, razorpay_payment_id, razorpay_order_id, amount)
    return updatedDoctor.subscription;
  } catch (error) {
    console.error('Subscription update failed:', error);
    throw error;
  }
};






//CreteOrUpdateSubscription
//Webhook version
export const createOrUpdateSubsWebhook = async (payment, doctorId) => {
  try {
    const { id, order_id, amount } = payment
    const doctor = await doctorModel.findById(doctorId)

    if (!doctor) {
      throw new Error("Doctor Not Found!");
    }

    let planType;
    if (amount === 999) {
      planType = 'monthly'
    } else if (amount === 9999) {
      planType = 'yearly'
    }

    // Get current date
    const now = new Date();

    // Set new end date based on plan type
    let endDate = new Date();
    if (planType === 'monthly') {
      endDate.setMonth(endDate.getMonth() + 1);
    } else if (planType === 'yearly') {
      endDate.setFullYear(endDate.getFullYear() + 1);
    }

    // If subscription hasn't expired yet, extend from current end date
    if (doctor.subscription.status !== 'expired' && doctor.subscription.endDate > now) {
      endDate = new Date(doctor.subscription.endDate);
      if (planType === 'monthly') {
        endDate.setMonth(endDate.getMonth() + 1);
      } else if (planType === 'yearly') {
        endDate.setFullYear(endDate.getFullYear() + 1);
      }
    }


    // Update subscription details
    const updatedDoctor = await doctorModel.findByIdAndUpdate(
      doctor._id,
      {
        $set: {
          'subscription.status': 'active',
          'subscription.plan': planType,
          'subscription.endDate': endDate,
          'subscription.startDate': now,
          'subscription.paymentId': id,
          'subscription.orderId': order_id
        }
      },
      { new: true, runValidators: true }
    );

    await sendSubscriptionActivateEmail(doctor.personalInfo.email, endDate, planType, razorpay_payment_id, razorpay_order_id, amount)

    return updatedDoctor.subscription;

  } catch (error) {
    console.error('Subscription update failed:', error);
    throw error;
  }
};