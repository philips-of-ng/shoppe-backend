import express from 'express'
import { getUsers, getUserByEmail, createUser, resetPassword, changePassword_ResetMode, loginUser, uploadDisplayPicture } from '../controllers/UserController.js'

const router = express.Router()

router.get('/', getUsers)
router.get('/:email', getUserByEmail)
router.post('/reset-password', resetPassword)
router.patch('/change-password/:email', changePassword_ResetMode)
router.post('/', createUser)
router.post('/login', loginUser)
router.post('/upload', uploadDisplayPicture)

export default router
