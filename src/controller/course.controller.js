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
import quizResultModel from "../models/quizResult.model.js";



// public
export const getCourses = funcWrapper(async (req, res) => {
    const { instructor, title } = req.query;
    let pageSize = req.query.pageSize || 6;
    let pageNumber = req.query.pageNumber || 1;
    let queryObj = {};
    if(instructor) {
        queryObj['instructor'] = instructor;
    }
    if (title) {
        queryObj['title'] = { $regex:title, $options:'i' };
    }
    const courses = await courseModel.find(queryObj).sort({title:1}).populate("instructor", "name")
                        .skip((pageNumber-1)*pageSize).limit(pageSize);
    if (!courses) {
        throw new ErrorResponse(404, "No Course Found");
    }
    res.status(200).json(new AppResponse(courses, "Course found"));
})


export const getCourseById = funcWrapper(async (req, res) => {
    const { courseId } = req.params;
    const course = await courseModel.findById(courseId).populate("instructor", "name email");
    if (!course) {
        throw new ErrorResponse(404, "No Course Found");
    }
    const assignments = await getCourseAssignments(course._id);
    const quizzes = await getCourseQuizes(course._id);
    const response = {course, assignments, quizzes};
    res.status(200).json(new AppResponse(response, "Course found"));
})


// Protected
export const createCourse = funcWrapper(async (req, res) => {
    const valid = validSchema.validationResult( req );
    if (!valid.isEmpty()) {
        throw valid.array();
    }

    let course = new Course({
        ...req.body,
        instructor: new Types.ObjectId(req.user.id)
    });
    course = await course.save();
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
    console.log(course);
    if (course.deletedCount === 0) {
        throw "This course is not exists or created by you";
    }
    res.status(200).json(new AppResponse(null,"Course deleted successfully"));
})

export const getStudentsCourseProgress = funcWrapper(async(req, res)=>{
    const {courseId} = req.params;
    const instructorId = req.user.id;
    const data = await Promise.all([
        await enrollmentModel.find({course:courseId}).select("-_id -course -__v -updatedAt").populate("student", "name email"),
        await getCountCourseAssignmentsAndQuizes(courseId),
        // await quizResultModel.find({instructor:instructorId, course:courseId}).select("-_id obtainMarks quiz").populate("quiz", "totalMarks").sort({obtainMarks:-1})
    ])

    const response = {
        students:data[0].map(s=>({
            completedModule: s.attendedAssignments.length+s.attendedQuizes.length,
            student:s.student,
            createdAt: s.createdAt
        })),
        totalModules: data[1].reduce((a,b)=>a+b),
        // quizResult : data[2].map(q=>({
        //     quizId:q.quiz._id,
        //     totalMarks: q.quiz.totalMarks,
        //     obtainMarks: q.obtainMarks
        // }))
    }
    res.status(200).json(new AppResponse(response, "success"));
})


export const getCountCourseAssignmentsAndQuizes = async (courseId)=>{
    try{
        const response = await Promise.all([
            await assignmentModel.countDocuments({course:courseId}),
            await quizModel.countDocuments({course:courseId})
        ])
        return response;
    }catch(err){
        console.log(err);
    }
}

export const submitReview=funcWrapper(async(req,res)=>{
            const courseId=req.params;
            const {rating,feedback}=req.body;
            if(!rating && !feedback){
                throw "Give rating and a review"
            }else{
                const rating=await courseModel.findOneAndUpdate({_id:courseId},{$set:{rating:rating,feedback:feedback}},{new:true, runValidators:true})
            }
            res.status(200).json(new AppResponse((rating,feedback),"Thanks for the Review"))
})