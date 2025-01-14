import express from 'express'
import multer from 'multer'
import { uploadDisplayPicture } from '../controllers/fileUploadController.js'

const router = express.Router()

// Use memory storage if you're uploading to Cloudinary directly
const storage = multer.memoryStorage()
const upload = multer({ storage }).single('image')  // Assuming the field name is 'file'

router.post('/upload', upload, uploadDisplayPicture)

export default router
