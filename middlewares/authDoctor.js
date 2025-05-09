//doctor authentication middleware
const authDoctor = async (req, res, next) => {
  try {
    if (req.isAuthenticated() && req.user?.userType === "doctor") {
      // For GET requests, add to query params
      if (req.method === 'GET') {
        req.query.docId = req.user._id;
      } 
      // For other methods (POST, PATCH, DELETE), add to body
      else {
        req.body.docId = req.user._id;
      }
      return next();
    } else {
      res.json({ success: false, message: 'Not authenticated' });
    }
  } catch (error) {
    console.log(error)
    res.json({ success: false, message: error.message });
  }
}

export default authDoctor;