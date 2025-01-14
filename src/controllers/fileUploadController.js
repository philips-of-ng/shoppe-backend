import express from 'express'
import multer from 'multer'
import { v2 as cloudinary } from 'cloudinary';
import fs from 'fs';
import dotenv from 'dotenv'

dotenv.config()

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
})


//UPLOAD DISPLAY PICTURE WHILE SIGNING IN

export const uploadDisplayPicture = async (request, response) => {

  try {
    if (!request.file) {
      return response.status(500).json({ error: 'No file uploaded' })
    }

    // Upload the image to Cloudinary
    const uploadResult = await cloudinary.uploader.upload_stream(
      { folder: 'shoppe-users-dp' },
      (error, result) => {
        if (error) {
          return response.status(500).json({ error: 'Error uploading file to Cloudinary' })
        }

        response.json({ imageUrl: result.secure_url })
        console.log('Result of the upload', result);
        
      }
    )

    // Pass the file buffer to the Cloudinary stream upload
    uploadResult.end(request.file.buffer)

  } catch (error) {
    response.status(500).send(error.message)
  }
}



