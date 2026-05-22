import AssignmentModel from '../models/assignment.model.js';
import FileModel from '../models/file.model.js';
import { funcWrapper } from '../util/wraperFunction.js';
import { AppResponse } from '../util/AppResponse.js';
import { uploadAssignmentFile } from './fileHandle.controller.js';
import { ErrorResponse } from '../util/ErrorResponse.js';
import courseModel from '../models/course.model.js';


export const addAssignment = funcWrapper(async (req, res) => {
    // Validation for Multer: check if file exists
    const { courseId } = req.params;

    if (!req.file) {
        throw new Error("Please upload a PDF file using the 'myFile' key.");
    }
    const course = await courseModel.findById(courseId);
    if(!course){
        throw new Error("Invalid Course Id");
    }
    
    const fileId = await uploadAssignmentFile( req );
    
    const assignment = await AssignmentModel.create({
        ...req.body,
        course: courseId,
        instructor: req.user.id,
        file: fileId
    });

    res.status(201).json(new AppResponse(assignment, "Assignment Added"));
})

export const deleteAssignment = funcWrapper(async (req, res) => {
    const { courseId, id } = req.params;
    console.log("delete runnig");
    console.log(courseId, id, req.user.id);
    const deleted = await AssignmentModel.findOneAndDelete({ _id: id, course:courseId, instructor: req.user.id });
    if ( ! deleted ) {
        return new ErrorResponse(404, "assignment not found");
    }
    console.log("delete runnig");
    const filecount = await AssignmentModel.countDocuments({ file: deleted.file });

    if (filecount === 0) {
        await FileModel.deleteOne({ _id: deleted.file });
    }
    res.status(200).json(new AppResponse(deleted, "Assignment Deleted"));
})


export const updateAssignment = funcWrapper(async (req, res) => {
    
    const { courseId, id } = req.params;

    if (req.file) {
        const fileId = await uploadAssignmentFile( req );
        req.body.file = fileId;
    }

    const updated = await AssignmentModel.findOneAndUpdate(
        { _id: id, course:courseId, instructor: req.user.id },
        req.body,
        { new: true, runValidators: true }
    );

    if (!updated) {
        return new ErrorResponse(404, "Assignment not found");
    }
    res.status(200).json(new AppResponse(null, "Updated"));
});


// For all registered users
export const searchAssignment = funcWrapper(async (req, res) => {
    let { instructorId, courseId } = req.query;
    if(!courseId){
        courseId = req.params.courseId;
    }

    const query = {};
    if (instructorId) {
        query['instructor'] = instructorId;
    }

    if (courseId) {
        query['course'] = courseId;
    }

    const assignment = await AssignmentModel.find(query);

    if (!assignment) {
        return res.status(404).json({ message: "No assignment found" });
    }
    console.log(assignment);
    res.status(200).json(new AppResponse(assignment, "found"));

})

export const getCourseAssignments = async (courseId)=>{
    try{
        return await AssignmentModel.find({course:courseId}).select("title dueDate totalMarks file");
    }catch(err){
        console.log(err);
    }
}




