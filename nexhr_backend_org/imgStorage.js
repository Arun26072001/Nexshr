const multer = require("multer");

const ImageStorage = multer.diskStorage({
    destination: (req, file, cb) => {
        cb(null, req?.uploadPath);
    },
    filename: (req, file, cb) => {
        const sanitizedFileName = file.originalname.replace(/\s+/g, '_').replace(/[^a-zA-Z0-9._-]/g, '');
        console.log(sanitizedFileName);
        
        const uniqueSuffix = `${Date.now()}-${sanitizedFileName}`;
        cb(null, uniqueSuffix);
    }
});

const uploadeImages = multer({ storage: ImageStorage });

const dynamicPathMiddleware = (type, customPath) => {
    return (req, res, next) => {
        let getPath;

        if (customPath) {
            getPath = path.join(__dirname, '..', customPath);
        } else {
            let basePath = routeToDirectoryMap[type] || 'uploads/images/';
            getPath = path.join(__dirname, '..', basePath);
        }
        req.uploadPath = getPath;
        console.log(`Full Path: ${getPath}`);
        ensureDirectoryExistence(getPath);
        next();
    };
};

module.exports = {dynamicPathMiddleware, uploadeImages};