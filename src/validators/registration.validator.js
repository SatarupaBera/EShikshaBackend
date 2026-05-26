import { body } from "express-validator";

export const registrationValidators = [
    body('name')
    .notEmpty().withMessage('Please enter your name.')
    .isLength({min:3}).withMessage('Must contains atleast 3 letters')
    .matches(/^[a-zA-Z ]+$/).withMessage('Only letter and spaces are allowed'),

    body('email')
    .notEmpty().withMessage('Please enter your email')
    .isEmail().withMessage('Enter your valid email'),

    body('password')
    .matches(/[a-z]+/).withMessage('atleast one lowecase letter')
    .matches(/[A-Z]+/).withMessage('atleast one uppercase letter')
    .matches(/[\d]+/).withMessage('atleast one digit')
    .matches(/[@#$&*^%]+/).withMessage('atleast one special character')
]