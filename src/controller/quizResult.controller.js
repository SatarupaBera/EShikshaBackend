import { funcWrapper } from "../util/wraperFunction.js";
import QuizResultModel from "../models/quizResult.model.js";
import { AppResponse } from "../util/AppResponse.js";
import quizModel from "../models/quiz.model.js";
import { updatedCourseInfo } from "./enrollment.controller.js";


export const addQuizResult = funcWrapper(async (req, res)=>{
    const {courseId, id} = req.params;
    const studentId = req.user.id;
    const {instructor, ...submittedQuizData} = req.body;
    if(!instructor){
        throw "Instructor id is required."
    }
    const quizData = await quizModel.findOne({_id:id, instructor:instructor, course:courseId}).select("-_id totalMarks questions");

    const obtainMarks = caluculateObtainMarks(quizData.questions, req.body.answers, quizData.totalMarks);

    const resultData = {
        instructor: instructor,
        student: studentId,
        course: courseId,
        quiz: id
    }

    const quizResult = await QuizResultModel.findOneAndUpdate(
        {instructor:instructor, course:courseId, student:studentId},
        {
            $set: {obtainMarks:obtainMarks, ...submittedQuizData},
            $setOnInsert: resultData
        },
        {
            upsert:true,
            returnDocument: 'after',
            runValidators: true
        }
    )
    if(!quizResult){
        throw "Internal server error";
    }

    updatedCourseInfo(courseId, studentId, 'quiz', id);

    res.status(200).json(new AppResponse(quizResult, "Result submitted successfully"));
})

const caluculateObtainMarks = (questions, answers, totalMarks)=>{
    let total = 0;
    let marksPerQuestion = totalMarks/questions.length;
    let qdata = questions.map(q=>({id:String(q._id), answer:q.answer}))
    console.log(qdata);
    answers.forEach(ans=>{
        let ind = qdata.findIndex(q=>q.id===ans.question);
        console.log(ind);
        if(qdata[ind].answer===ans.answer){
            total+=marksPerQuestion;
        }
    })
    return total;
}