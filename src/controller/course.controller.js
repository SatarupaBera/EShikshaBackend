import { funcWrapper } from "../util/wraperFunction.js";
import Course from "../models/course.model.js";
import validSchema from 'express-validator';
import { Types } from "mongoose";
import courseModel from "../models/course.model.js";
import { AppResponse } from "../util/AppResponse.js";
import { ErrorResponse } from "../util/ErrorResponse.js";
import { getCourseAssignments } from "./assignment.controller.js";
import { getCourseQuizes } from "./quiz.controller.js";
import assignmentModel from "../models/assignment.model.js";
import quizModel from "../models/quiz.model.js";
import enrollmentModel from "../models/enrollment.model.js";

// public
//landing page--
export const getCourses = funcWrapper(async (req, res) => {
    const { instructor, title } = req.query;
    let pageSize = req.query.pageSize || 6;
    let pageNumber = req.query.pageNumber || 1;
    let totalCourses = 0;
    let queryObj = {};
    if(instructor) {
        queryObj['instructor'] = instructor;
    }
    if (title) {
        queryObj['title'] = { $regex:title, $options:'i' };
    }
    const courses = await courseModel.find(queryObj)
                                    .sort({title:1})
                                    .populate("instructor", "name")     
                                    .skip((pageNumber-1)*pageSize)
                                    .limit(pageSize)
                                    .lean();
    if(instructor){
        totalCourses = await courseModel.countDocuments({instructor:instructor});
    }

    const courseEnrollments = await enrollmentModel.aggregate([
        {
            $match:{
                course: {$in:courses.map(c=>c._id)}
            }
        },
        {
            $group:{
                _id:"$course",
                enrolled:{$sum:1}
            }
        }
    ])

    const rescourses = courses.map(c=>{
        const ec = courseEnrollments.find(en=>en._id.toString()==c._id.toString());
        return {...c, ...ec};
    })

    if (!courses) {
        throw new ErrorResponse(404, "No Course Found");
    }
    res.status(200).json(new AppResponse({courses:rescourses, totalCourses}, "Course found"));
})

//courseDetails page--
export const getCourseById = funcWrapper(async (req, res) => {
    const { courseId } = req.params;
    const { studentId } = req.query;
    let isEnrolled = false;
    const course = await courseModel.findById(courseId).populate("instructor", "name email");
    if (!course) {
        throw new ErrorResponse(404, "No Course Found");
    }
    if(studentId){
        isEnrolled = (await enrollmentModel.countDocuments({course:course._id, student:studentId})>0?true:false);
    }
    const [assignments, quizzes, totalEnrollments] = await Promise.all([
        getCourseAssignments(course._id),
        getCourseQuizes(course._id),
        enrollmentModel.countDocuments({course:course._id})
    ])
    const response = {course, assignments, quizzes, totalEnrollments, isEnrolled};
    res.status(200).json(new AppResponse(response, "Course found"));
})


// Protected
export const createCourse = funcWrapper(async (req, res) => {
    const valid = validSchema.validationResult( req );
    if (!valid.isEmpty()) {
        throw valid.array();
    }
    let course = await new Course({
        ...req.body,
        instructor: new Types.ObjectId(req.user.id)
    }).save();
    res.status(201).json(new AppResponse(course, "Course created successfully."));
})


export const updateCourse = funcWrapper(async (req, res) => {
    const id = req.params.id;
    const course = await courseModel.findOneAndUpdate({ _id: id, instructor: req.user.id }, { $set: req.body }, {
        runValidators: true,
        returnDocument: "after", 
        context: 'query'
    });
      
    if (!course) {
        throw "This course is not exists or created by you";
    }

    res.status(200).json(new AppResponse(course, "Course updated successfully."));
})


export const deleteCourse = funcWrapper(async (req, res) => {
    const id = req.params.id;
    const course = await courseModel.deleteOne({ _id: id, instructor: req.user.id });
    if (course.deletedCount === 0) {
        throw "This course is not exists or created by you";
    }
    res.status(200).json(new AppResponse(null,"Course deleted successfully"));
})

export const getStudentsCourseProgress = funcWrapper(async(req, res)=>{
    const {courseId} = req.params;
    const data = await Promise.all([
        enrollmentModel.find({course:courseId}).select("-_id -course -__v -updatedAt").populate("student", "name email"),
        getCountCourseAssignmentsAndQuizes(courseId),
    ])

    const response = {
        students:data[0].map(s=>({
            completedModule: s.attendedAssignments.length+s.attendedQuizes.length,
            student:s.student,
            createdAt: s.createdAt
        })),
        totalModules: data[1].reduce((a,b)=>a+b)
    }
    res.status(200).json(new AppResponse(response, "success"));
})


export const getCountCourseAssignmentsAndQuizes = async (courseId)=>{
    try{
        const response = await Promise.all([
            assignmentModel.countDocuments({course:courseId}),
            quizModel.countDocuments({course:courseId})
        ])
        return response;
    }catch(err){
        throw err;
    }
}

export const submitReview = funcWrapper( async(req, res)=>{
    const { courseId } = req.params;
    const { rating, name, feedback } = req.body;
    if(!rating || !feedback){
        throw "Give rating and a review"
    }
    const ratFeedback = await courseModel.findOne({_id:courseId});
    if(!ratFeedback){
        throw "No course Available";
    }
    const updatedRating = parseFloat((((ratFeedback.rating.average*ratFeedback.rating.totalUsers)+rating)/(ratFeedback.rating.totalUsers+1)).toFixed(2));
    const totalUser = ratFeedback.rating.totalUsers+1;

    const result = await courseModel.findOneAndUpdate(
        {_id:courseId}, 
        {
            $set:{
                "rating.totalUsers":totalUser,
                "rating.average": updatedRating
            },
            $push:{
                feedback:{name:name, message:feedback}
            }
        },
        {
            returnDocument:'after',
            runValidators: true
        }
    ).select("-_id feedback");
    
    res.status(200).json(new AppResponse(result,"Thanks for the Review"))
})