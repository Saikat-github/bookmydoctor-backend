//doctor authentication middleware
const authAdmin = async (req, res, next) => {
    try {
      if (req.isAuthenticated() && req.user?.userType === "admin") {
        return next();
      } else {
        res.json({ success: false, message: 'Not authenticated' });
      }
    } catch (error) {
      res.json({ success: false, message: error.message });
    }
  }
  
  export default authAdmin;