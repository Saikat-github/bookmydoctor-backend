import nodemailer from 'nodemailer';

const frontendUrl = process.env.FRONTEND_URL
const transporter = nodemailer.createTransport({
  service: 'gmail',
  auth: {
    user: process.env.EMAIL_USERNAME,
    pass: process.env.EMAIL_PASSWORD
  }
});



//Forget password otp sending mail
const sendOTPEmail = async (email, otp) => {
  const mailOptions = {
    from: process.env.EMAIL_FROM,
    to: email,
    subject: 'OTP for bookmydoctor',
    html: `
        <h2>OTP verificaton request for bookmydoctor panel</h2>
        <p>Your OTP is <strong>${otp}</strong></p>
        <p>This OTP will expire in 10 minutes.</p>
        <p>If you didn't request this, please ignore this email.</p>

        <br>
        <br>
        <p><strong>Team bookmydoctor.</strong></p> </div>`
  };
  await transporter.sendMail(mailOptions);
};



//Subcription expiration mail sending
const sendSubscriptionExpiredEmail = async (email, name="User") => {
  const mailOptions = {
    from: process.env.EMAIL_FROM,
    to: email,
    subject: 'Your Trial Period Has Expired. Renew Now!',
    html: `
<div style="font-family:Arial,sans-serif;max-width:600px;margin:auto;"> <h2 style="color:#007BFF;">Trial Expired – Keep Accessing Powerful Features</h2> <p>Hi ${name},</p> <p>Your 14-day trial for the <strong>bookmydoctor</strong> doctor panel has ended.</p> <p>To continue managing appointments and serving patients seamlessly, we recommend subscribing to a suitable plan.</p> <a href="${frontendUrl}" style="display:inline-block;padding:10px 15px;background-color:#28a745;color:#fff;border-radius:5px;text-decoration:none;">View Subscription Plans</a> <p style="margin-top:30px;">Thank you for trying bookmydoctor.</p> <p>Warm regards,<br><strong>Team bookmydoctor</strong></p> </div> `
  };
  await transporter.sendMail(mailOptions);
}



//Subscription reminder mail sending
const sendReminderEmail = async (email, name, endDate, isTrialEnding) => {
  const daysLeft = Math.ceil(
    (endDate - new Date()) / (1000 * 60 * 60 * 24)
  );
  const mailOptions = {
    from: process.env.EMAIL_FROM,
    to: email,
    subject: `Your ${isTrialEnding ? "Trial" : "Subscription"} Expires in ${daysLeft} Days`,
    html: `
<div style="font-family:Arial,sans-serif;max-width:600px;margin:auto;"> <h2 style="color:#ff8800;">Your ${isTrialEnding ? 'Trial' : 'Subscription'} is Ending Soon</h2> <p>Hi ${name},</p> <p>You have <strong>${daysLeft} days</strong> remaining in your ${isTrialEnding ? 'trial period' : 'active subscription'}.</p> <p>Don't miss out on uninterrupted access to all features of <strong>bookmydoctor</strong>.</p> <a href="${frontendUrl}" style="display:inline-block;padding:10px 15px;background-color:#007BFF;color:#fff;border-radius:5px;text-decoration:none;">Renew Now</a> <p style="margin-top:30px;">Thank you for being with us.</p> <p>Warm wishes,<br><strong>Team bookmydoctor</strong></p> </div>
      `
  }
  await transporter.sendMail(mailOptions);
}



//Subscription Activation email
const sendSubscriptionActivateEmail = async (email, endDate, planType, paymentId, orderId, amount) => {
  try {
    const date = new Date(endDate);
    const options = { month: 'long', day: 'numeric', year: 'numeric' };

    const mailOptions = {
      from: process.env.EMAIL_FROM,
      to: email,
      subject: `Your Subscription for bookmydoctor has been activated`,
      html: `
<div style="font-family:Arial,sans-serif;max-width:600px;margin:auto;"> <h2 style="color:#28a745;">Welcome! Your Subscription is Now Active</h2> <p>Hi there,</p> <p>Your subscription to <strong>bookmydoctor</strong> has been successfully activated. Here are your details:</p> <ul> <li><strong>Plan:</strong> ${planType}</li> <li><strong>Amount:</strong> ₹${amount}</li> <li><strong>Valid Until:</strong> ${date.toLocaleDateString('en-US', options)}</li> <li><strong>Order ID:</strong> ${orderId}</li> <li><strong>Payment ID:</strong> ${paymentId}</li> </ul> <p>We’re thrilled to have you onboard!</p> <p>Warm regards,<br><strong>Team bookmydoctor</strong></p> </div>`
    };
    await transporter.sendMail(mailOptions);
  } catch (error) {
    throw error;
  }
}



//Subscription cancel mail sending
const sendSubscriptionCancelEmail = async (email, name='User') => {
  const mailOptions = {
    from: process.env.EMAIL_FROM,
    to: email,
    subject: `Subscription Cancelled`,
    html: `
<div style="font-family:Arial,sans-serif;max-width:600px;margin:auto;"> <h2 style="color:#dc3545;">Subscription Cancelled</h2> <p>Hi ${name},</p> <p>We're confirming that your subscription to <strong>bookmydoctor</strong> has been cancelled.</p> <p>This means you no longer have access to features or booking capabilities.</p> <p>If this was a mistake, or you change your mind, you can easily reactivate:</p> <a href="${frontendUrl}/chekcout" style="display:inline-block;padding:10px 15px;background-color:#007BFF;color:#fff;border-radius:5px;text-decoration:none;">Reactivate Subscription</a> <p>Thanks again for trying bookmydoctor.</p> <p>Warm regards,<br><strong>Team bookmydoctor</strong></p> </div>`
  };
  await transporter.sendMail(mailOptions);
}



//Subscription cancel mail sending
const sendProfileDeletionMail = async (email, name="Doctor") => {
  const mailOptions = {
    from: process.env.EMAIL_FROM,
    to: email,
    subject: `Profile Deleted`,
    html: `
<div style="font-family:Arial,sans-serif;max-width:600px;margin:auto;"> <h2 style="color:#dc3545;">Profile Deleted</h2> <p>Hi ${name},</p> <p>We're confirming that your proile in <strong>bookmydoctor.</strong> has been deleted.</p> <p>This means you no longer have access to features or booking capabilities.</p> <p>If this was a mistake, or you change your mind, you can always create a new profile:</p> <a href="${frontendUrl}/doctor-profile" style="display:inline-block;padding:10px 15px;background-color:#007BFF;color:#fff;border-radius:5px;text-decoration:none;">Create Profile</a> <p>Thanks again for trying bookmydoctor.</p> <p>Warm regards,<br><strong>Team bookmydoctor.</strong></p> </div>`
  };
  await transporter.sendMail(mailOptions);
}


//Subscription cancel mail sending
const sendAccountDeletionMail = async (email, name="Doctor") => {
  const mailOptions = {
    from: process.env.EMAIL_FROM,
    to: email,
    subject: `Account Deleted`,
    html: `
<div style="font-family:Arial,sans-serif;max-width:600px;margin:auto;"> <h2 style="color:#dc3545;">Account Deleted</h2> <p>Hi ${name},</p> <p>We're confirming that your account and all profile data in <strong>bookmydoctor.</strong> has been deleted.</p> <p>This means you no longer have access to features or booking capabilities.</p> <p>If this was a mistake, or you change your mind, you can always create a new Account:</p> <a href="${frontendUrl}" style="display:inline-block;padding:10px 15px;background-color:#007BFF;color:#fff;border-radius:5px;text-decoration:none;">Create Account</a> <p>Thanks again for trying bookmydoctor.</p> <p>Warm regards,<br><strong>Team bookmydoctor.</strong></p> </div>`
  };
  await transporter.sendMail(mailOptions);
}





// Helper functions -- Helper functions -- Helper functions 
const generateOTP = () => {
  return Math.floor(100000 + Math.random() * 900000).toString();
};

function isValidEmail(email) {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
}

const isOTPExpired = (expiryDate) => {
  return new Date() > expiryDate;
};
export { generateOTP, isOTPExpired, sendOTPEmail, sendReminderEmail, sendSubscriptionExpiredEmail, sendSubscriptionActivateEmail, sendSubscriptionCancelEmail, isValidEmail, sendProfileDeletionMail, sendAccountDeletionMail };