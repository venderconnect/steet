const multer = require('multer');
const { CloudinaryStorage } = require('multer-storage-cloudinary');
const cloudinary = require('cloudinary').v2;

// Configure Cloudinary
cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

// Configure multer storage for Cloudinary
const storage = new CloudinaryStorage({
  cloudinary: cloudinary,
  params: {
    folder: 'street-food-products',
    format: async (req, file) => {
      console.log('Multer processing file:', file.originalname);
      console.log('Multer processing request body:', req.body);
      return 'png';
    }, // supports promises as well
    public_id: (req, file) => `${Date.now()}-${file.originalname}`,
  },
});

// Create the multer instance
const upload = multer({ storage: storage });

module.exports = upload;