import mongoose from "mongoose";
import courseModel from "../models/course.model.js";
import enrollmentModel from "../models/enrollment.model.js";
import userModel from "../models/user.model.js";
import { AppResponse } from "../util/AppResponse.js";
import { ErrorResponse } from "../util/ErrorResponse.js";
import { funcWrapper } from "../util/wraperFunction.js";
import crypto from 'crypto';
import quizResultModel from "../models/quizResult.model.js";

// User
export const updateUserSettings = funcWrapper(async (req, res)=>{
    const userId = req.user.id;
    if(!userId){
        throw "Pass valid userId";
    }
    const {name, email, password} = req.body;
    let updatedData = {};
    if(name) updatedData['name']=name;
    if(email) updatedData['email']=email;
    if(password){
        if(!email) throw "Email is required for updating password";
        const user = await userModel.findOne({email});
        if(!user) throw "Invalid user or email address";
        if(user.id!==userId){
            throw "You don't have permission for updating this user password";
        }
        updatedData['password']=crypto.hash('sha256', password);
    }
    await userModel.findByIdAndUpdate({_id:userId}, {$set:updatedData}, {runValidators:true});
    res.status(200).json(new AppResponse(null, "settings changed"));
})

export const getUserSettings = funcWrapper(async (req, res)=>{
    if(!req.user.id){
        throw "You are not a valid user";
    }
    const user = await userModel.findById(req.user.id).select("-password -__v -createdAt -updatedAt -_id");
    if(!user){
        throw new ErrorResponse(404, "User not found");
    }
    res.status(200).json(new AppResponse(user, "success"));
})



export const getInstructorDashboard = funcWrapper(async (req, res)=>{
    const instructorId = req.user.id;

    const courses = await courseModel.aggregate([
        {
            $match:{
                instructor: new mongoose.Types.ObjectId(instructorId)
            }
        },
        {
            $project:{
                title:1,
                category:1,
                avarageRating:"$rating.average"
            }
        },
        {
            $sort:{
                avarageRating:-1
            }
        }
    ])

    const courseIds = courses.map(c=>c._id);

    const students = await enrollmentModel.aggregate([
        {
            $match:{
                course:{$in:courseIds}
            }
        },
        {
            $group:{
                _id:"$course",
                totalStudents: { $sum : 1 }
            }
        },
        {
            $project:{
                _id:0,
                course:"$_id",
                totalStudents: 1
            }
        },
        {
            $sort:{
                course:1
            }
        }
    ])

    res.status(200).json(new AppResponse({courses, students}, "Success"));
})
// student dashboard api
export const getStudentDashboard = funcWrapper(async (req, res)=>{
    const studentId = req.user.id;
    const enrolledCourses = await enrollmentModel.aggregate([
        {
            $match:{
                student: new mongoose.Types.ObjectId(studentId)
            }
        },
        {
            $lookup:{
                from: "courses",
                localField: "course",
                foreignField:"_id",
                as: "course"
            }
        },
        {
            $lookup:{
                from:"assignments",
                localField: "course._id",
                foreignField:"course",
                as: "courseAssignments"
            }
        },
        {
            $lookup:{
                from:"quizzes",
                localField: "course._id",
                foreignField:"course",
                as: "courseQuizes"
            }
        },
        {
            $project:{
                _id:0,
                createdAt:1,
                "course._id":1,
                "course.title": 1,
                "course.category":1,
                totalAttended:{$add:[
                    {$size: "$attendedAssignments"}, 
                    {$size: "$attendedQuizes"}
                ]},
                totalModule: {
                    $add: [
                        { $size: { $ifNull: ["$courseAssignments", []] } },
                        { $size: { $ifNull: ["$courseQuizes", []] } }
                    ]
                }
            }
        },
        {
            $sort:{
                createdAt:-1
            }
        }
    ])

    const quizResult = await quizResultModel.find({student:studentId}).select("quiz obtainMarks createdAt").populate("quiz", "-_id totalMarks").populate("course", "-_id title category").sort({obtainMarks:-1});

    res.status(200).json(new AppResponse({enrolledCourses, quizResult}, "success"));
})