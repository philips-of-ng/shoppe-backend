import joi from 'joi'

const userSchema = joi.object({
  firstName: joi.string().required(),
  lastName: joi.string().required(),
  fullName: joi.string().required(),
  email: joi.string().required(),
  password: joi.string().required(),
  displayPicture: joi.string()
})

export default userSchema
