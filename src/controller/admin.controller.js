import { AppResponse } from "../util/AppResponse.js";
import UserModel from "../models/user.model.js";
import { funcWrapper } from "../util/wraperFunction.js";
import userModel from "../models/user.model.js";
import courseModel from "../models/course.model.js";

export const getAllUser = funcWrapper(async (req, res)=>{
    let {pageNumber, pageLimit} = req.query;
    pageLimit = pageLimit||5;
    pageNumber = pageNumber||1;

    let query = {role:{$not:{$in:"ADMIN"}}};
    if(req.query.role){
        query['role']=req.query.role;
    }
    if(req.query.searchVal){
        query['$or']=[
            {name: {$regex:req.query.searchVal, $options:'i'}},
            {email: {$regex:req.query.searchVal, $options:'i'}},
        ]
    }
    const users = await UserModel.find(query).select("-password").skip((pageNumber-1)*pageLimit).limit(pageLimit);
    if(!users){
        throw "No users found";
    }
    res.status(200).json(new AppResponse(users, "Success"));
})

export const updateUser = funcWrapper(async (req, res)=>{
    const userId = req.params.userId;
    const {email, name} = req.body;
    let updatedDet = {};
    if(email) updatedDet['email']=email;
    if(name) updatedDet['name']=name;
    const user = await UserModel.findByIdAndUpdate({_id:userId}, {$set:updatedDet}, {
        runValidators:true,
    })
    if(!user) throw "Something Went Wrong";
    res.status(200).json(new AppResponse(null, "User Updated"));
})

export const removeUser = funcWrapper( async (req, res)=>{
    const userId = req.params.userId;
    await UserModel.findByIdAndDelete({_id:userId});
    res.status(200).json(new AppResponse(null, "User Deleted"));
})

export const getDashboard = funcWrapper(async (req, res)=>{
    const fiveMonthAgoDate = new Date();
    fiveMonthAgoDate.setMonth(fiveMonthAgoDate.getMonth()-5);
    fiveMonthAgoDate.setDate(1);
    fiveMonthAgoDate.setHours(0,0,0,0);

    const data = await Promise.all([
        userModel.aggregate([
            {
                $match:{
                    role: {
                        $in : ["INSTRUCTOR", "STUDENT"]
                    }
                }
            },
            {
                $group:{
                    _id: "$role",
                    total: {$sum: 1}
                }
            },
            {
                $sort:{
                    role:1
                }
            }
        ]),
        userModel.aggregate([
            {
                $match:{
                    createdAt: {
                        $gte: fiveMonthAgoDate
                    },
                    role:{
                        $in:["INSTRUCTOR", "STUDENT"]
                    }
                }
            },
            {
                $group:{
                    _id:{
                        year: {$year: "$createdAt"},
                        month: {$month: "$createdAt"},
                        role: "$role"
                    },
                    count: {$sum:1}
                }
            },
            {
                $sort:{
                    '_id.year':1,
                    '_id.month':1
                }
            },
            {
                $project:{
                    _id: 0,
                    year: '$_id.year',
                    month: '$_id.month',
                    role: '$_id.role',
                    count: '$count'
                }
            }
        ]),
        courseModel.aggregate([
            {
                $sort:{
                    "rating.average":-1
                }
            },
            {
                $project:{
                    _id:0,
                    title:1,
                    averageRating:"$rating.average"
                }
            },
            {
                $limit:5
            }
        ]),
        courseModel.countDocuments({})
    ])
    res.status(200).json(new AppResponse({userDetails:{totalUser:data[0], monthlyEnrollments:data[1]}, courseDetails:{topCourses:data[2], totalCourses:data[3]}}));
})