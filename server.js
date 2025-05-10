import express from 'express';
import dotenv from 'dotenv/config';
import cors from 'cors';
import connectDB from './config/mongodb.js';
import { connectCloudinary } from './config/cloudinary.js';
import adminRouter from './routes/adminRoute.js';
import doctorRouter from './routes/doctorRoute.js';
import userRouter from './routes/userRoute.js';
import passport from './config/passportConfig.js';
import session from 'express-session';
import winston from 'winston';
import MongoStore from 'connect-mongo';
import { globalRateLimiter } from './middlewares/rateLimit.js';
import xss from 'xss-clean';
import mongoSanitize from 'express-mongo-sanitize';
import helmet from 'helmet';
import http from 'http';
import { Server } from 'socket.io';
// import migrateDoctors from './config/migrate_doctor_schema.js';



// App config
const app = express();
const port = process.env.PORT || 4000;

// Socket.io configuration
const server = http.createServer(app);
const io = new Server(server, {
  cors: {
    origin: [process.env.FRONTEND_URL, process.env.USER_URL, process.env.ADMIN_URL],
    credentials: true,
    methods: ["GET", "POST", "DELETE", "PUT", "PATCH"]
  }
});



// Middleware
app.use(express.json());
app.use(cors({
  origin: [process.env.FRONTEND_URL, process.env.USER_URL, process.env.ADMIN_URL],
  credentials: true,
  methods: ["GET", "POST", "DELETE", "PUT", "PATCH"]
}));
app.use(helmet());
app.use(xss());
app.use(mongoSanitize());





// Session configuration
app.use(
  session({
    secret: process.env.SESSION_SECRET, // Different from production
    resave: false,
    saveUninitialized: false,
    store: MongoStore.create({
      mongoUrl: process.env.MONGO_URI,
      ttl: 7 * 24 * 60 * 60
    }),
cookie: {
  maxAge: 7 * 24 * 60 * 60 * 1000,
  httpOnly: true,
  secure: process.env.NODE_ENV === 'production', // secure only in prod
  sameSite: process.env.NODE_ENV === 'production' ? 'none' : 'lax', // allow cross-site in prod
}
,
    rolling: true
  })
);



// Initialize Passport
app.use(passport.initialize());
app.use(passport.session());



// DB and Cloudinary config
connectDB();
connectCloudinary();
//Call the below migration file when schema changes in migrate_doctor_schema.js
// migrateDoctors()



// Global request logging with Winston
const logger = winston.createLogger({
  transports: [
    new winston.transports.Console(),
    new winston.transports.File({ filename: 'app.log' })
  ]
});


//Global rateLimiter
app.use(globalRateLimiter)
// Global error handling middleware
app.use((err, req, res, next) => {
  logger.error(err); // Log the error for debugging
  res.json({ success: false, message: 'Something went wrong!' });
});




// API endpoints
app.use('/api/admin', adminRouter);
app.use("/api/doctor", doctorRouter);
app.use("/api/user", userRouter);



io.on('connection', (socket) => {
  // console.log('Client connected:', socket.id);
  socket.on('subscribe-to-doctor', (room) => {
    socket.join(`doctor-${room.doctorId}+${room.date}`);
  });

  socket.on('disconnect', () => {});
});

// Make io available to our routes
app.set('io', io);



// Basic hello world route
app.get('/', (req, res) => res.status(200).send('Hello World'));

// Listener
server.listen(port, () => {
  console.log(`Server running on port ${port}`);
});


export { io };