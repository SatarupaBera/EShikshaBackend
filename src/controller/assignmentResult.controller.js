import { funcWrapper } from "../util/wraperFunction.js";
import assignmentResultModel from "../models/assignmentResult.model.js";
import courseModel from "../models/course.model.js";
import { uploadAssignmentFile } from "./fileHandle.controller.js";
import assignmentModel from "../models/assignment.model.js";
import { AppResponse } from "../util/AppResponse.js";
import { ErrorResponse } from "../util/ErrorResponse.js";
import mongoose from "mongoose";
import { updatedCourseInfo } from "./enrollment.controller.js";


export const addResult = funcWrapper(async (req, res) => {
    const { courseId, assignmentId } = req.params;
    const studentId = req.user.id;

    if (!req.file) {
        throw new Error("Please upload a PDF file using the 'myFile' key.");
    }
    const course = await courseModel.findById(courseId);
    if (!course) {
        throw new ErrorResponse(404, "Target course not found");
    }
    console.log(course);
    const fileId = await uploadAssignmentFile(req);

    const result = await assignmentResultModel.create({
        student: studentId,
        course: courseId,
        instructor: course.instructor,
        assignment: assignmentId,
        file: fileId,
        marks: req.body.marks | 0
    });

    res.status(201).json(new AppResponse(result, "result Added"));

})


export const searchResults = funcWrapper(async (req, res) => {

    const { courseId, assignmentId } = req.params;
    let instructorId = req.user.id;
    console.log(courseId, assignmentId, instructorId);

    //   const result=await assignmentResultModel.find({course:courseId,
    //     instructor:instructorId,
    //     assignment:assignmentId}).select("student file")
    //   .populate('student', "name email");

    const result = await assignmentResultModel.aggregate([
        {
            $match: {
                course: new mongoose.Types.ObjectId(courseId),
                instructor: new mongoose.Types.ObjectId(instructorId),
                assignment: new mongoose.Types.ObjectId(assignmentId),
                marks: { $lte: 0 }      //can give marks to only ungraded students
            }
        },
        {
            $lookup: {
                from: "users",            // collection name for students
                localField: "student",       // field in assignmentResultModel
                foreignField: "_id",         // field in students collection
                as: "student"
            }

        },
        {
            $unwind: "$student"
        },
        {
            $project: {
                file: 1,                      // exclude assignmentResult _id
                "student.name": 1,
                "student.email": 1
            }
        }
    ])

if (!result) {
    throw new ErrorResponse(404, "not found");
}

console.log(result);
res.status(200).json(new AppResponse(result, "found"));

})


export const deleteResult = funcWrapper(async (req, res) => {

    const { resultId } = req.params;
    const instructorId = req.user.id;

    const deleted = await assignmentResultModel.findOneAndDelete({
        _id: resultId,
        instructor: instructorId
    });
    if (!deleted) {
        return new ErrorResponse(404, "problem while deleting");
    }

    const filecount = await assignmentResultModel.countDocuments({ file: deleted.file });

    if (filecount === 0) {
        await FileModel.deleteOne({ _id: deleted.file });
    }
    res.status(200).json(new AppResponse(deleted, "Assignment Deleted"));

})


export const giveMarks = funcWrapper(async (req, res) => {
    const { courseId, resultId } = req.params;
    const instructorId = req.user.id;
       
    const validInstructor = await courseModel.findOne({ instructor: instructorId, _id: courseId });
    if (!validInstructor) {
        throw new ErrorResponse(404, "Only valid instructors can give marks")
    }


    const updated = await assignmentResultModel.findOneAndUpdate(
        { _id: resultId, instructor: instructorId },
        { $set: { marks: req.body.marks } }, // Target precise update properties explicitly
        { new: true, runValidators: true }
    ).populate('student', "name email");

    if (!updated) {
        return new ErrorResponse(404, "problem updating marks");
    }

    updatedCourseInfo(courseId, updated.student, 'assignment', updated.assignment);
    
    res.status(200).json(new AppResponse(null, "marks Updated"));
})
