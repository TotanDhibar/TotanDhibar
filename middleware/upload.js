/**
 * File Upload Middleware with Sharp Image Processing
 * Handles file uploads with automatic image resizing
 */
const multer = require('multer');
const sharp = require('sharp');
const path = require('path');
const fs = require('fs');

// Ensure upload directories exist
const uploadDirs = ['images', 'certificates', 'team', 'gallery'];
uploadDirs.forEach(dir => {
  const fullPath = path.join(__dirname, '..', 'public', 'uploads', dir);
  if (!fs.existsSync(fullPath)) {
    fs.mkdirSync(fullPath, { recursive: true });
  }
});

// Configure multer for memory storage (we'll process with Sharp before saving)
const storage = multer.memoryStorage();

// File filter for allowed types
const fileFilter = (req, file, cb) => {
  // Define allowed mime types
  const allowedImageTypes = /jpeg|jpg|png|gif|webp/;
  const allowedDocTypes = /pdf|doc|docx/;
  
  const extname = path.extname(file.originalname).toLowerCase();
  const mimetype = file.mimetype;
  
  // Check if it's an image
  if (allowedImageTypes.test(extname.replace('.', '')) || allowedImageTypes.test(mimetype)) {
    file.isImage = true;
    return cb(null, true);
  }
  
  // Check if it's a document
  if (allowedDocTypes.test(extname.replace('.', ''))) {
    file.isImage = false;
    return cb(null, true);
  }
  
  cb(new Error('Invalid file type. Only JPEG, PNG, GIF, WEBP, PDF, DOC, DOCX are allowed.'));
};

// Create multer upload instance
const upload = multer({
  storage: storage,
  limits: { fileSize: 10 * 1024 * 1024 }, // 10MB limit
  fileFilter: fileFilter
});

/**
 * Process uploaded image with Sharp
 * @param {Buffer} buffer - Image buffer from multer
 * @param {string} filename - Original filename
 * @param {string} uploadType - Type of upload (images, team, gallery)
 * @param {Object} options - Resize options
 * @returns {Promise<string>} - Path to saved file
 */
async function processImage(buffer, filename, uploadType = 'images', options = {}) {
  // Default resize options based on upload type
  const defaultOptions = {
    images: { width: 1200, height: 800, fit: 'inside' },
    team: { width: 400, height: 400, fit: 'cover' },
    gallery: { width: 1600, height: 1200, fit: 'inside' },
    logo: { width: 300, height: 150, fit: 'inside' },
    hero: { width: 1920, height: 1080, fit: 'cover' }
  };
  
  const resizeOptions = options.resize || defaultOptions[uploadType] || defaultOptions.images;
  
  // Generate unique filename
  const sanitizedName = path.basename(filename).replace(/[^a-zA-Z0-9.-]/g, '_');
  const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
  const ext = '.webp'; // Convert all images to WebP for better compression
  const newFilename = uniqueSuffix + ext;
  
  // Determine output directory
  const outputDir = path.join(__dirname, '..', 'public', 'uploads', uploadType);
  const outputPath = path.join(outputDir, newFilename);
  
  // Process image with Sharp
  await sharp(buffer)
    .resize(resizeOptions.width, resizeOptions.height, {
      fit: resizeOptions.fit,
      withoutEnlargement: true
    })
    .webp({ quality: 85 })
    .toFile(outputPath);
  
  return '/uploads/' + uploadType + '/' + newFilename;
}

/**
 * Process non-image file (just save it)
 * @param {Buffer} buffer - File buffer from multer
 * @param {string} filename - Original filename
 * @param {string} uploadType - Type of upload
 * @returns {Promise<string>} - Path to saved file
 */
async function processDocument(buffer, filename, uploadType = 'certificates') {
  // Sanitize filename
  const sanitizedName = path.basename(filename).replace(/[^a-zA-Z0-9.-]/g, '_');
  const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
  const ext = path.extname(filename);
  const newFilename = uniqueSuffix + ext;
  
  // Determine output directory
  const outputDir = path.join(__dirname, '..', 'public', 'uploads', uploadType);
  const outputPath = path.join(outputDir, newFilename);
  
  // Save file
  fs.writeFileSync(outputPath, buffer);
  
  return '/uploads/' + uploadType + '/' + newFilename;
}

/**
 * Middleware to handle single file upload with image processing
 */
function handleSingleUpload(fieldName, uploadType = 'images', options = {}) {
  return [
    upload.single(fieldName),
    async (req, res, next) => {
      try {
        if (!req.file) {
          return next();
        }
        
        // Check if file is an image
        const isImage = /jpeg|jpg|png|gif|webp/i.test(req.file.mimetype);
        
        if (isImage) {
          req.file.path = await processImage(
            req.file.buffer,
            req.file.originalname,
            uploadType,
            options
          );
        } else {
          req.file.path = await processDocument(
            req.file.buffer,
            req.file.originalname,
            uploadType
          );
        }
        
        next();
      } catch (err) {
        console.error('File processing error:', err);
        next(err);
      }
    }
  ];
}

/**
 * Middleware to handle multiple file uploads with image processing
 */
function handleMultipleUpload(fieldName, uploadType = 'gallery', maxCount = 10, options = {}) {
  return [
    upload.array(fieldName, maxCount),
    async (req, res, next) => {
      try {
        if (!req.files || req.files.length === 0) {
          return next();
        }
        
        // Process each file
        const processedFiles = await Promise.all(
          req.files.map(async (file) => {
            const isImage = /jpeg|jpg|png|gif|webp/i.test(file.mimetype);
            
            if (isImage) {
              file.path = await processImage(
                file.buffer,
                file.originalname,
                uploadType,
                options
              );
            } else {
              file.path = await processDocument(
                file.buffer,
                file.originalname,
                uploadType
              );
            }
            
            return file;
          })
        );
        
        req.files = processedFiles;
        next();
      } catch (err) {
        console.error('File processing error:', err);
        next(err);
      }
    }
  ];
}

/**
 * Middleware to handle mixed file uploads (multiple fields)
 */
function handleFieldsUpload(fields, options = {}) {
  return [
    upload.fields(fields),
    async (req, res, next) => {
      try {
        if (!req.files) {
          return next();
        }
        
        // Process each field's files
        for (const fieldName of Object.keys(req.files)) {
          const uploadType = options[fieldName]?.uploadType || 'images';
          const fieldOptions = options[fieldName] || {};
          
          req.files[fieldName] = await Promise.all(
            req.files[fieldName].map(async (file) => {
              const isImage = /jpeg|jpg|png|gif|webp/i.test(file.mimetype);
              
              if (isImage) {
                file.path = await processImage(
                  file.buffer,
                  file.originalname,
                  uploadType,
                  fieldOptions
                );
              } else {
                file.path = await processDocument(
                  file.buffer,
                  file.originalname,
                  uploadType
                );
              }
              
              return file;
            })
          );
        }
        
        next();
      } catch (err) {
        console.error('File processing error:', err);
        next(err);
      }
    }
  ];
}

module.exports = {
  upload,
  processImage,
  processDocument,
  handleSingleUpload,
  handleMultipleUpload,
  handleFieldsUpload
};
