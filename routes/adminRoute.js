import express from 'express';
import { adminDashData, allDocAccounts, allDocProfiles, deleteDocProfile, deleteDocAccount, getSingleDoctor, getTopDoctorsBySerials, changeVerificationStatus, getAppointments } from '../controllers/admin/adminController.js';
import { adminLogout, adminGoogleLogin, getAdmin} from '../controllers/admin/adminAuth.js';
import authAdmin from '../middlewares/authAdmin.js';
import passport from 'passport'
import { getDocPayments } from '../controllers/admin/adminPayment.js';


const adminRouter = express.Router();


//Google Login
// Redirect to Google OAuth
adminRouter.get('/google', passport.authenticate('admin-google', { scope: ['profile', 'email'] }));
// Google OAuth callback
adminRouter.get(
  '/google/callback',
  passport.authenticate('admin-google', { failureRedirect: `${process.env.ADMIN_URL}/login?success=false&message=unauthorized_request` }), adminGoogleLogin
);
adminRouter.get('/current_user', authAdmin, getAdmin)
adminRouter.post('/logout', adminLogout);

adminRouter.get("/dashdata", authAdmin, adminDashData);
adminRouter.get("/all-profiles", authAdmin, allDocProfiles);
adminRouter.get("/all-accounts", authAdmin, allDocAccounts);
adminRouter.get("/top-doctors", authAdmin, getTopDoctorsBySerials);
adminRouter.get("/get-doctor", authAdmin, getSingleDoctor)
adminRouter.post("/change-verification", authAdmin, changeVerificationStatus);
adminRouter.get("/get-appointments", authAdmin, getAppointments);

adminRouter.post("/delete-profile", authAdmin, deleteDocProfile);
adminRouter.post("/delete-docaccount", authAdmin, deleteDocAccount);


adminRouter.get("/doctor-allpayments", authAdmin, getDocPayments);


export default adminRouter;