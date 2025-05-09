
import cron from 'node-cron'
import doctorModel from '../models/doctor/doctorModel.js';
import { sendReminderEmail, sendSubscriptionExpiredEmail } from './email.js';



// Check for expired subscriptions (runs at 00:05 every day)
const checkExpiredSubscriptions = async () => {
  try {
    const now = new Date();

    // Step 1: Find only the doctorId, name, and email — no full documents
    const expiringDoctors = await doctorModel.find(
      {
        'subscription.endDate': { $lt: now },
        'subscription.status': { $ne: 'expired' }
      },
      {
        doctorId: 1,
        'personalInfo.name': 1,
        'personalInfo.email': 1,
        _id: 0
      }
    );

    if (expiringDoctors.length === 0) {
      console.log(`[${new Date().toISOString()}] No expired subscriptions found.`);
      return;
    }

    const doctorIds = expiringDoctors.map(doc => doc.doctorId);

    // Step 2: Bulk update all expired subscriptions
    await doctorModel.updateMany(
      {
        doctorId: { $in: doctorIds }
      },
      {
        $set: {
          'subscription.status': 'expired',
          'availability.isAvailable': false
        }
      }
    );

    // Step 3: Send emails in parallel (can also be throttled/queued if needed)
    await Promise.all(
      expiringDoctors.map(doctor =>
        sendSubscriptionExpiredEmail(
          doctor.personalInfo.email,
          doctor.personalInfo.name
        )
      )
    );

    console.log(
      `[${new Date().toISOString()}] Updated ${doctorIds.length} expired subscriptions`
    );
  } catch (error) {
    console.error(
      `[${new Date().toISOString()}] Error checking expired subscriptions:`,
      error
    );
    throw error;
  }
};




// Send reminders to doctors whose trials or subscriptions are ending soon (runs at 08:00 every day)
const sendSubscriptionReminders = async () => {
  try {
    const now = new Date();
    const threeDaysLater = new Date(now);
    threeDaysLater.setDate(threeDaysLater.getDate() + 3);
    
    // Find doctors whose subscription ends in 3 days
    const doctors = await doctorModel.find({
      'subscription.endDate': { 
        $gte: now, 
        $lte: threeDaysLater 
      },
      'subscription.status': { $ne: 'expired' }
    });
    
    for (const doctor of doctors) {
      const isTrialEnding = doctor.subscription.status === 'trial';
      await sendReminderEmail(
        doctor.personalInfo.email, 
        doctor.personalInfo.name, 
        doctor.subscription.endDate, 
        isTrialEnding
      );
    }
    
    console.log(`[${new Date().toISOString()}] Sent reminders to ${doctors.length} doctors`);
  } catch (error) {
    console.error(`[${new Date().toISOString()}] Error sending subscription reminders:`, error);
    throw error;
  }
};



// Function to set up all cron jobs
const setupCronJobs = () => {
  // Run checkExpiredSubscriptions at 00:05 every day
  // Format: sec min hour day-of-month month day-of-week
  cron.schedule('0 5 0 * * *', () => {
    console.log(`[${new Date().toISOString()}] Running subscription expiration check`);
    checkExpiredSubscriptions();
  });
  
  // Run sendSubscriptionReminders at 08:00 every day
  cron.schedule('0 0 8 * * *', () => {
    console.log(`[${new Date().toISOString()}] Running subscription reminder check`);
    sendSubscriptionReminders();
  });
  
  console.log('Cron jobs scheduled successfully');
};



export {setupCronJobs}