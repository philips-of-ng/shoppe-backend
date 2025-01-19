import User from '../models/UserModel.js'
import userSchema from '../validations/UserValidation.js'
import cloudinary from 'cloudinary'
const useCloudinary = cloudinary.v2
import multer from 'multer'
import path from 'path'
import nodemailer from 'nodemailer'
import fs from 'fs'
import { response } from 'express'
import { hashPassword, comparePasswords } from '../Middlewares/PasswordManager.js'
import { argon2d } from 'argon2'

export const upload = multer({ dest: 'uploads/' }).single('image')


//GETS AN ARRAY OF ALL USERS
export const getUsers = async (request, response) => {
  try {
    console.log('I got the request');
    const users = await User.find()
    response.status(200).json(users)
  } catch (error) {
    response.status(400).json({ message: error.message })
  }
}


//GETS A SPECIFIC USER USING THEIR EMAIL
export const getUserByEmail = async (request, response) => {
  try {
    console.log('Get user by email request received');

    const email = request.params.email;
    console.log('The param:', email);

    const theUser = await User.findOne({ email });

    if (!theUser) {
      console.log('No user found for email:', email);
      return response.status(404).json({ message: 'User not found' });
    }

    console.log('This is the user:', theUser);
    response.status(200).json(theUser);

  } catch (error) {
    console.error('Error occurred while fetching user by email:', error.message);
    response.status(500).json({ message: 'An error occurred while processing your request' });
  }
};



//CREATE A NEW USER IN THE DB
export const createUser = async (request, response) => {
  console.log('Create user request received, here is the request body', request.body);

  const userExists = await User.findOne({ email: request.body.email })
  if (userExists) {
    console.log('This user already exists in our database', userExists);
    return response.status(409).json({ message: 'User already exists in our database' })
  }

  const { error } = userSchema.validate(request.body);
  if (error) {
    return response
      .status(400)
      .json({ message: `Validation error: ${error.details[0].message}` });
  }

  const plainPassword = request.body.password

  const hashedPassword = await hashPassword(plainPassword)

  try {
    const { firstName, lastName, fullName, email, displayPicture } = request.body
    const newUser = await User.create({ firstName, lastName, fullName, email, displayPicture, password: hashedPassword });
    console.log('User created successfully:', newUser);
    response.status(201).json({ message: 'User created successfully', userDetails: newUser });
  } catch (error) {
    console.error('Error creating user:', error.message);
    response.status(400).json({ message: 'Error creating user', error: error.message });
  }
};


//LOGIN WITH LOGIN CODE --- IN PROGRESS...
const sendLoginCode = async (request, response) => {
  const userCredentials = request.body

  try {
    const user = await User.findOne({ email: userCredentials.email })
    if (user) {
      const email = request.body.email
      const otp = Math.floor(100000 + Math.random() + 900000).toString()

      const transporter = nodemailer.createTransport({
        service: 'gmail',
        auth: {
          user: 'edunphilips3@Gmail.com',
          pass: 'aukxagjlspshtbki'
        },
        tls: {
          rejectUnauthorized: false
        }
      })

      const currentTime = new Date().toLocaleTimeString()

      const mailConfig = {
        from: 'philipsedun@gmail.com',
        to: email,
        subject: 'Shoppe Login Code',
        text: `Your login code, requested as at ${currentTime} is ${otp}. If you didn't request this OTP, please ignore this message.`
      }

      const mailResponse = await transporter.sendMail(mailConfig)
        console.log(mailResponse);
        if (mailResponse.accepted[0]) {
          console.log('Mail sent successfully.');
          response.status(200).json({ message: 'Mail Sent Successfully.', otp: otp })
        } else if (!mailResponse.accepted[0] || mailResponse.rejected[0]) {
          response.status(400).json({ message: 'Mail Rejected' })
        }
    }
  } catch (error) {
    console.log('Error trying to login with Login Code', error);
    response.status(400).json({ message: error })
  }
}


export const loginUser = async (request, response) => {

  const userCredentials = request.body
  console.log('Login request received', userCredentials);
  try {
    const user = await User.findOne({ email: userCredentials.email })

    console.log("User found", user);
    

    //COMPARING OF THE PASSWORD SHOULD TAKE PLACE HERE
    const plainPassword = request.body.password
    const hashedPassword = user.password

    const pwMatched = await comparePasswords(plainPassword, hashedPassword)

    if (user && pwMatched) {
      console.log('Access Granted', user);
      response.status(200).json({ message: 'Access Granted', details: user })
    } else if (!user) {
      response.status(404).json({ message: 'Wrong Credentials' })
    } else if (!pwMatched) {
      response.status(500).json({ message: 'wrong password' })
    }
  } catch (error) {
    response.status(400).json({ message: `Error from try-catch in backend ${error}` })
  }
}


//GENERATES OTP AND SENDS TO USER EMAIL FOR PASSWORD RESET
export const resetPassword = async (request, response) => {

  console.log('Reset Password CTRLR Reached!', request.body);

  const email = request.body.email
  const otp = Math.floor(100000 + Math.random() * 900000).toString()

  const userExists = await User.findOne({ email: request.body.email })

  if (!userExists) {
    console.log('There is no user with the email in our database', email);
    response.status(404).json({ message: `User with email '${email}' not found` })
  } else {
    console.log('User found', userExists);

    //THIS IS THE FUNCTION THAT ACTUALLY SENDS THE EMAIL
    const sendOTPEmail = async (email, otp) => {
      try {
        const transporter = nodemailer.createTransport({
          service: 'gmail',
          auth: {
            user: 'edunphilips3@Gmail.com',
            pass: 'aukxagjlspshtbki'
          },
          tls: {
            rejectUnauthorized: false
          }
        })

        const currentTime = new Date().toLocaleTimeString()

        const mailConfig = {
          from: 'philipsedun@gmail.com',
          to: email,
          subject: 'Shoppe Password Reset OTP',
          text: `The otp to reset your password requested as at ${currentTime} is ${otp}`
        }

        const mailResponse = await transporter.sendMail(mailConfig)
        console.log(mailResponse);
        if (mailResponse.accepted[0]) {
          console.log('Mail sent successfully.');
          response.status(200).json({ message: 'Mail Sent Successfully.', otp: otp })
        } else if (!mailResponse.accepted[0] || mailResponse.rejected[0]) {
          response.status(400).json({ message: 'Mail Rejected' })
        }

      } catch (error) {
        console.log('This error occured while trying to send the OTP Mail', error);
        response.status(400).json({ message: 'Error sending OTP Mail' })
      }
    }
    sendOTPEmail(email, otp)
  }

}


//ACTUALLY CHANGES THE PASSWORD THROUGH RESETING
export const changePassword_ResetMode = async (request, response) => {

  console.log('Reset password reached', request);


  try {
    const user = await User.findOne({ email: request.body.email })

    const hashedNewPassword = await hashPassword(request.body.newPassword)

    if (user) {
      console.log('User found:', user);

      const filter = { email: request.body.email }
      const update = { password: hashedNewPassword }
      const options = { new: true, runValidators: true }

      const updatedUser = await User.findOneAndUpdate(filter, update, options)
      console.log('Updated User', updatedUser);
      response.status(200).json({ message: 'Password updated successfully.' })
    }

  } catch (error) {
    console.log('Error updating user', error);
    response.status(400).json({ message: 'Error updating password!' })
  }

}



