import { body } from "express-validator";

export const assignmentValidators = [

    body('title')
        .isString().withMessage('Title must be a string')
        .notEmpty().withMessage('title needed')
        .isLength({ min: 5 }).withMessage('Title must be at least 5 characters long')
        .trim(),

    body('dueDate')
        .isISO8601().withMessage('Due date must be a valid date')
        .notEmpty().withMessage('due date needed.')
        .toDate(),
    
    body('totalMarks')
        .isInt({ min: 1 }).withMessage('Total marks must be a positive integer')
        .notEmpty().withMessage('total Marks needed'),

    body('instructor')
    .custom((_, {req})=>{
        if(!req.user.id){
            throw new Error("Instructor Authentication required");
        }
        return true;
    }),
    body('myFile')
        .custom((_, { req }) => {
            if (!req.file) {
                throw new Error("File is required");
            }
            if (req.file.mimetype !== 'application/pdf') {
                throw new Error("Only PDF files are allowed");
            }
            return true;
        })

    // body('file')
    //     .notEmpty().withMessage("File is rquired")
    //     .isMongoId().withMessage('FileId must be a valid Mongo ObjectId if provided')

]