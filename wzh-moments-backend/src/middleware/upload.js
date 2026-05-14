import multer from 'multer';
import CloudinaryStorage from 'multer-storage-cloudinary';
import cloudinary from '../config/cloudinary.js';

const eventStorage = new CloudinaryStorage({
  cloudinary,
  params: {
    folder: 'wzh-moments/events',
    allowed_formats: ['jpg', 'jpeg', 'png', 'webp'],
    transformation: [
      { width: 1200, height: 600, crop: 'fill' },
      { quality: 'auto' },
      { fetch_format: 'auto' },
    ],
  },
});

const profileStorage = new CloudinaryStorage({
  cloudinary,
  params: {
    folder: 'wzh-moments/profiles',
    allowed_formats: ['jpg', 'jpeg', 'png', 'webp'],
    transformation: [
      { width: 400, height: 400, crop: 'fill', gravity: 'face' },
      { quality: 'auto' },
      { fetch_format: 'auto' },
    ],
  },
});

const portfolioStorage = new CloudinaryStorage({
  cloudinary,
  params: {
    folder: 'wzh-moments/portfolio',
    allowed_formats: ['jpg', 'jpeg', 'png', 'webp'],
    transformation: [
      { width: 800, height: 600, crop: 'fill' },
      { quality: 'auto' },
      { fetch_format: 'auto' },
    ],
  },
});

const limits = { fileSize: 5 * 1024 * 1024 };

const fileFilter = (_req, file, cb) => {
  if (file.mimetype.startsWith('image/')) {
    cb(null, true);
  } else {
    cb(new Error('Only image files allowed!'), false);
  }
};

export const uploadEventCover = multer({
  storage: eventStorage,
  limits,
  fileFilter,
}).single('coverImage');

export const uploadProfilePicture = multer({
  storage: profileStorage,
  limits,
  fileFilter,
}).single('profileImage');

export const uploadPortfolio = multer({
  storage: portfolioStorage,
  limits,
  fileFilter,
}).array('portfolioImages', 5);
