const mongoose = require('mongoose');
const dotenv = require('dotenv');
const connectDB = require('./config/db');

const User = require('./models/User');
const Patient = require('./models/Patient');
const Clinic = require('./models/Clinic');
const MedicalRecord = require('./models/MedicalRecord');

dotenv.config();
connectDB();

const importData = async () => {
  try {
    await User.deleteMany();
    await Patient.deleteMany();
    await Clinic.deleteMany();
    await MedicalRecord.deleteMany();

    await User.create({ username: 'admin', password: 'admin123', role: 'admin', name: 'HealthPass Main Admin', status: 'approved' });

    await Clinic.create([
      { id: 'PHC-0142', name: 'Rural PHC, Gwagwalada', state: 'FCT', lga: 'Gwagwalada', address: 'Gwagwalada Road', phone: '0803 111 2201', status: 'approved', walletBalance: 48500, services: ['General', 'Maternity'] },
      { id: 'ABK-001', name: 'Federal Medical Centre Abeokuta', state: 'Ogun', lga: 'Abeokuta South', address: 'Idi-Aba, Abeokuta', phone: '0803 222 1100', services: ['General', 'Surgery', 'Pediatrics'], status: 'approved', walletBalance: 0 },
      { id: 'ABK-002', name: 'Sacred Heart Hospital', state: 'Ogun', lga: 'Abeokuta North', address: 'Lantoro, Abeokuta', phone: '0803 333 2200', services: ['General', 'Maternity', 'Lab'], status: 'approved', walletBalance: 0 },
      { id: 'ABK-003', name: 'Olabisi Onabanjo University Teaching Hospital', state: 'Ogun', lga: 'Sagamu', address: 'Sagamu, Ogun State', phone: '0803 444 3300', services: ['General', 'Surgery', 'Pediatrics', 'Maternity'], status: 'approved', walletBalance: 0 },
      { id: 'ABK-004', name: 'Ibadan Clinic Abeokuta', state: 'Ogun', lga: 'Abeokuta South', address: 'Ibara, Abeokuta', phone: '0803 555 4400', services: ['General', 'Dental'], status: 'approved', walletBalance: 0 },
      { id: 'ABK-005', name: 'Hosanna Hospital', state: 'Ogun', lga: 'Abeokuta North', address: '12 Main Street, Abeokuta', phone: '0803 999 8877', services: ['General', 'Maternity', 'Lab'], status: 'approved', walletBalance: 0 }
    ]);

    await User.create([
      { username: 'phc0142', password: 'clinic123', role: 'subadmin', name: 'Dr. Halima Sule', clinicId: 'PHC-0142', status: 'approved' },
      { username: 'funke', password: 'staff123', role: 'staff', name: 'Funke Okafor', title: 'Community health officer', clinicId: 'PHC-0142', status: 'approved' }
    ]);

    await Patient.create({
      qrid: 'HP-0234-8891', name: 'Amina Yusuf', phone: '08034567821', email: 'amina@example.com', dob: '1998-05-14', gender: 'Female', pin: '1234', balance: 12500
    });

    await MedicalRecord.create([
      { patientId: 'HP-0234-8891', type: 'Visit', title: 'General Checkup', clinic: 'Rural PHC', date: '24 Oct 2026', detail: 'Routine visit • BP 120/80', amount: -1500 },
      { patientId: 'HP-0234-8891', type: 'Visit', title: 'Malaria Treatment', clinic: 'Rural PHC', date: '12 Sep 2026', detail: 'Lab test + medication', amount: -3500 },
      { patientId: 'HP-0234-8891', type: 'Vaccination', title: 'Tetanus • Dose 1', clinic: 'Rural PHC', date: '12 Sep 2026', detail: 'Nurse Ngozi', status: 'done' },
      { patientId: 'HP-0234-8891', type: 'Vaccination', title: 'Hepatitis B • Dose 2', clinic: 'Rural PHC', date: '10 Oct 2026', detail: 'Due date passed', status: 'overdue' }
    ]);

    console.log('Data Imported! 6 Clinics and demo accounts ready.');
    process.exit();
  } catch (error) {
    console.error(`Error: ${error.message}`);
    process.exit(1);
  }
};

importData();