const multer = require('multer');
const path = require('path');
const fs = require('fs');
const { v4: uuidv4 } = require('uuid');
const AppError = require('../utils/AppError');

// Ensure upload directories exist
const uploadDirs = [
    'uploads/resumes',
    'uploads/company-licenses',
    'uploads/voice-notes',
    'uploads/profile-pictures',
];

uploadDirs.forEach(dir => {
    if (!fs.existsSync(dir)) {
        fs.mkdirSync(dir, { recursive: true });
    }
});

// Configure storage
const storage = multer.diskStorage({
    destination: (req, file, cb) => {
        let uploadPath = 'uploads/';
        
        if (file.fieldname === 'resume') {
            uploadPath = 'uploads/resumes/';
        } else if (file.fieldname === 'license') {
            uploadPath = 'uploads/company-licenses/';
        } else if (file.fieldname === 'voice_note') {
            uploadPath = 'uploads/voice-notes/';
        } else if (file.fieldname === 'profile_picture') {
            uploadPath = 'uploads/profile-pictures/';
        }
        
        cb(null, uploadPath);
    },
    filename: (req, file, cb) => {
        const uniqueName = `${uuidv4()}${path.extname(file.originalname)}`;
        cb(null, uniqueName);
    },
});

// File filter
const fileFilter = (req, file, cb) => {
    const allowedMimes = [
        'application/pdf',
        'application/msword',
        'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
        'image/jpeg',
        'image/png',
        'image/webp',
        'audio/mpeg',
        'audio/wav',
        'audio/ogg',
    ];
    
    if (allowedMimes.includes(file.mimetype)) {
        cb(null, true);
    } else {
        cb(new AppError(`File type ${file.mimetype} is not allowed`, 400), false);
    }
};

const upload = multer({
    storage,
    fileFilter,
    limits: {
        fileSize: 10 * 1024 * 1024, // 10MB limit
    },
});

module.exports = upload;
