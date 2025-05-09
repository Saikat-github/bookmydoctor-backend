import passport from 'passport';


//API for normal admin login
const adminLogin = async (req, res, next) => {
    passport.authenticate('admin-local', (err, user, info) => {
        if (err) {
            return res.json({ success: false, message: "Internal Server Error" });
        }
        if (!user) {
            return res.json({ success: false, message: info.message });
        }

        req.login(user, (err) => {
            if (err) {
                return res.json({ success: false, message: err.message });
            }
            return res.json({ success: true, message: "Login Successful" });
        });
    })(req, res, next);
}



//API for Google Login
const adminGoogleLogin = async (req, res) => {
    res.redirect(`${process.env.ADMIN_URL}?success=true&message=Google_login_successful`);
};



//Getting Current Admin API
const getAdmin = async (req, res) => {
    try {
        // Return the user data, but ensure password and sensitive info are not exposed
        const { password, ...userData } = req.user.toObject();
        return res.json({ success: true, user: userData });
    } catch (error) {
        res.json({ success: false, message: error.message });
    }
}



const adminLogout = async (req, res) => {
    try {
        req.logout((err) => {
            if (err) {
                return res.json({ success: false, message: err.message });
            }
        })
        res.json({ success: true, message: "Logged out successfully" });
    } catch (error) {
        console.log(error);
        res.json({ success: false, message: error.message });
    }
}




export { adminLogin, adminGoogleLogin, getAdmin, adminLogout, }