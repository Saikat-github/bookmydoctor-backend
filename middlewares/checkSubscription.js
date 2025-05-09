import doctorModel from "../models/doctor/doctorModel.js";


// Middleware to check subscription status
export const checkSubscription = async (req, res, next) => {
  try {
    let docId
    if (req.method === 'GET') {
      docId = req.query.docId
    }
    // For other methods (POST, PATCH, DELETE), add to body
    else {
      docId = req.body.docId
    }

    const doctor = await doctorModel.findOne({ doctorId: docId });
    if (!doctor) {
      return res.json({
        success: false,
        message: "Details not found, please create or update your details on profile Page"
      })
    }

    // Check if subscription has expired
    if (doctor.subscription.endDate < new Date()) {
      // Update only necessary fields using $set
      await doctorModel.updateOne(
        { doctorId: docId },
        {
          $set: {
            'availability.isAvailable': false,
            'subscription.status': 'expired'
          }
        }
      );
      return res.json({ 
        success: false, 
        message: 'Your subscription has expired' 
      });
    }
    

    next();
  } catch (error) {
    console.log(error)
    res.json({
      success: false,
      message: error.message,
    });
  }
};
