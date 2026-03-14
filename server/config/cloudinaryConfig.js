const multer = require('multer');
const { CloudinaryStorage } = require('multer-storage-cloudinary');
const cloudinary = require('cloudinary').v2;
const dotenv = require('dotenv');
const fs = require('fs');

cloudinary.config({
    cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
    api_key: process.env.CLOUDINARY_API_KEY,
    api_secret: process.env.CLOUDINARY_API_SECRET,
});

const uploadFileToCloudinary = (file) => {
    let resourceType = 'raw';
    if (file.mimetype.startsWith('image/')) {
        resourceType = 'image';
    } else if (file.mimetype.startsWith('video/')) {
        resourceType = 'video';
    } else if (file.mimetype.startsWith('audio/')) {
        // Cloudinary treats audio as video/raw; use video for playback + transformations
        resourceType = 'video';
    }

    const options = {
        resource_type: resourceType,
    };
    if (file.mimetype.startsWith('audio/')) {
        options.format = 'mp3';
    }

    return new Promise((resolve, reject) => {
        const uploader = (resourceType === 'video' || resourceType === 'raw')
            ? cloudinary.uploader.upload_large
            : cloudinary.uploader.upload;

        uploader(file.path, options, (error, result) => {
            try {
                fs.unlinkSync(file.path); // Remove file from local uploads folder
            } catch (e) {
                console.warn('Could not remove temp file:', file.path, e);
            }

            if (error) {
                return reject(error);
            }
            resolve(result);
        });
    });
};
//
const multerMiddleware = multer({ dest: 'uploads/' }).single('media');

module.exports = { uploadFileToCloudinary, multerMiddleware };