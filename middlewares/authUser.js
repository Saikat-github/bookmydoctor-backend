import jwt from 'jsonwebtoken';

//user authentication middleware
const authUser = async (req, res, next) => {
    try {
        const { token } = req.headers
        if (!token) return res.json({ success: false, message: 'Access Denied' });

        const token_decode = jwt.verify(token, process.env.JWT_SECRET);

        req.body.userId = token_decode.id;
        next();

    } catch (error) {
        if (error.name === 'TokenExpiredError') {
            return res.json({ success: false, message: 'Session Expired, Login Again' });
        }
        console.log(error);
        res.status(403).json({ success: false, message: 'Invalid Token' });
    }
}

export default authUser;