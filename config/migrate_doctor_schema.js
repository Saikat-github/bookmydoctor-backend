import mongoose from 'mongoose';
import doctorModel from '../models/doctor/doctorModel.js';
import { getPublicIdFromUrl } from './cloudinary.js';


async function migrateDoctors() {
    try {
        await mongoose.connect(`${process.env.MONGO_URI}/prescripto`);
        console.log('Connected to MongoDB Atlas');
        const doctors = await doctorModel.find();

        for (const doctor of doctors) {
          let updated = false;
      
          const imageUrl = doctor.personalInfo?.image;
          const licenseUrl = doctor.professionalInfo?.licenseDocument;
      
          const imagePublicId = getPublicIdFromUrl(imageUrl);
          const licensePublicId = getPublicIdFromUrl(licenseUrl);
      
          if (imagePublicId && !doctor.personalInfo.imagePublicId) {
            doctor.personalInfo.imagePublicId = imagePublicId;
            updated = true;
          }
      
          if (licensePublicId && !doctor.professionalInfo.licensePublicId) {
            doctor.professionalInfo.licensePublicId = licensePublicId;
            updated = true;
          }
      
          if (updated) {
            await doctor.save();
            console.log(`Updated doctor ${doctor._id}`);
          }
        }
      
        console.log('Migration completed.');
        mongoose.disconnect();

    } catch (error) {
        console.error('Migration failed:', error);
    } finally {
        await mongoose.connection.close();
        console.log('Database connection closed');
    }
}

export default migrateDoctors;