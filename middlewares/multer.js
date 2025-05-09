import multer from 'multer';

// Memory storage for Cloudinary upload
const storage = multer.memoryStorage();
const upload = multer({ 
    storage: storage,
    limits: {
        fileSize: 5 * 1024 * 1024 // 5MB file size limit
    },
    fileFilter: (req, file, cb) => {
        const allowedTypes = ['image/jpeg', 'image/png', 'image/jpg', 'application/pdf'];
        if (allowedTypes.includes(file.mimetype)) {
            cb(null, true);
        } else {
            cb(new Error('Invalid file type. Only JPEG, PNG, JPG, and PDF are allowed.'));
        }
    }
});

// Custom multi-upload middleware
const uploadDoctorFiles = upload.fields([
    { name: 'image', maxCount: 1 },
    { name: 'licenseDocument', maxCount: 1 }
]);


export default uploadDoctorFiles; 