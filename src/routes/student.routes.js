import express from 'express';
import { getCourseById, submitReview } from '../controller/course.controller.js';
import { downloadAssignmentFile } from '../controller/fileHandle.controller.js';
import { addResult } from '../controller/assignmentResult.controller.js';
import multer from 'multer';
import { enrollment, showEnrolledCourses, deleteEnrollment } from '../controller/enrollment.controller.js';
import { getQuizById } from '../controller/quiz.controller.js';
import { addQuizResult } from '../controller/quizResult.controller.js';
import { getStudnetAnnouncements } from '../controller/announcements.controller.js';
import { getStudentDashboard } from '../controller/user.controller.js';


const router = express.Router();

const storage = multer.memoryStorage();
const uploading = multer({
    storage,
    limits: { fileSize: 5 * 1024 * 1024 } // 5mb limit
});

router.route("/dashboard")
    .get( getStudentDashboard )

router.route("/course")
    .get( showEnrolledCourses )

router.route("/course/:courseId/review")
    .post( submitReview )

router.route("/course/:courseId/enroll")
    .post(enrollment)
    .delete( deleteEnrollment )

router.route("/course/:courseId/assignment/:assignmentId/result")
    .post(uploading.single('myFile'),addResult)

router.route("/course/:courseId/assignment-result")
        .get(getMarks);                              
        
//download
router.route("/course/:courseId/assignment/download/:id")
    .get(downloadAssignmentFile);

router.route("/course/:courseId/quiz/:id")
    .post( addQuizResult )
    .get( getQuizById )

router.route("/announcements")
    .get( getStudnetAnnouncements )
    

export default router;