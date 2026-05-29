import announcementModel from "../models/announcement.model.js";
import enrollmentModel from "../models/enrollment.model.js";
import { AppResponse } from "../util/AppResponse.js";
import { ErrorResponse } from "../util/ErrorResponse.js";
import { funcWrapper } from "../util/wraperFunction.js";

export const publishAnnocement=funcWrapper(async(req,res)=>{
    const { courseId } = req.params;
    const instructorId=req.user.id;
    let annocement= await new announcementModel({message:req.body.message, course: courseId, instructor:instructorId}).save();
    annocement = await annocement.populate("course", "-_id title category")
    if(!annocement){
        throw new Error("internal server error");
    }
    res.status(201).json(new AppResponse({message:annocement.message, course:annocement.course, createdAt:annocement.createdAt},"annocement created"));
})

export const deleteAnnouncement = funcWrapper(async (req, res) => {
   
    const { id } = req.params;
    const instructorId = req.user.id;

    
    const deletedAnnouncement = await announcementModel.findOneAndDelete({
        _id: id,
        instructor: instructorId
    });

    
    if (!deletedAnnouncement) {
        return res.status(404).json(new AppResponse(null, "Announcement not found or unauthorized"));
    }

    
    res.status(200).json(new AppResponse(null, "Announcement deleted successfully"));
});

export const getInstructorAnnouncements = funcWrapper(async (req, res) => {
    const {courseId} = req.params;
    const instructorId = req.user.id;

    const announcements = await announcementModel.find({course:courseId, instructor:instructorId}).select("-_id course message createdAt").populate("course", "-_id title category").sort({ createdAt: -1 });
    
    if (!announcements) {
        return new ErrorResponse(404, "No announcements found");
    }
    
    res.status(200).json(new AppResponse(announcements, "Announcements fetched successfully"));
});

export const getStudnetAnnouncements = funcWrapper(async(req, res)=>{
    const studentId = req.user.id;
    //check for the enrolled courses
    const enrolledCourses = await enrollmentModel.find({student:studentId}).select("-_id course");
    //map enrolledcourses to courses
    const courses = enrolledCourses.map(c=>c.course)
    //sarch that course in announcementModel
    const announcements = await announcementModel.find({course:{$in:courses}}).select("-_id message course instructor createdAt").populate("course", "-_id title category").populate("instructor", "name").sort({ createdAt: -1 });
    
    if (!announcements) {
        return new ErrorResponse(404, "No announcements found");
    }
    
    res.status(200).json(new AppResponse(announcements, "Announcements fetched successfully"));
}) 