import express from 'express';
import { getCourseById, submitReview } from '../controller/course.controller.js';
import { downloadAssignmentFile } from '../controller/fileHandle.controller.js';
import { addResult, deleteResult, giveMarks, searchResults } from '../controller/assignmentResult.controller.js';
import { deleteAssignment } from '../controller/assignment.controller.js';
import multer from 'multer';
import { enrollment, showEnrolledCourses, deleteEnrollment } from '../controller/enrollment.controller.js';
import { getQuizById } from '../controller/quiz.controller.js';
import { addQuizResult } from '../controller/quizResult.controller.js';
import { getStudnetAnnouncements } from '../controller/announcements.controller.js';


const router = express.Router();

const storage = multer.memoryStorage();
const uploading = multer({
    storage,
    limits: { fileSize: 5 * 1024 * 1024 } // 5mb limit
});


router.route("/course")
    .get( showEnrolledCourses )
    
//review
router.post("/course/review/:courseId",submitReview)

router.route("/course/:courseId/enroll")
    .post(enrollment)
    .delete( deleteEnrollment )

router.route("/course/:courseId/assignment/:assignmentId/result")
    .post(uploading.single('myFile'),addResult)                                          // Instructor views all submissions                           // Student deletes their submission


//download
router.route("/course/:courseId/assignment/download/:id").get(downloadAssignmentFile);

router.route("/course/:courseId/quiz/:id")
    .post( addQuizResult )
    .get( getQuizById )

router.route("/announcements")
    .get( getStudnetAnnouncements )
    

export default router;