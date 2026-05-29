import { Types } from 'mongoose';
import quizModel from '../models/quiz.model.js';
import { AppResponse } from '../util/AppResponse.js';
import { ErrorResponse } from '../util/ErrorResponse.js';
import { funcWrapper } from '../util/wraperFunction.js';

//instructor adds a quiz--
export const addQuiz = funcWrapper( async (req, res) => {
    const { questions, markPerQuestion} = req.body;
    
    const { courseId } = req.params;
    if (!questions || questions.length === 0) {
        throw new Error("A quiz must have at least one question.");
    }
     
    req.body.course=courseId;
    req.body.instructor=req.user.id;
    req.body.totalMarks=markPerQuestion*questions.length;
    
    const newQuiz = await new quizModel(req.body).save();
    

    res.status(201).json(new AppResponse(newQuiz, "Quiz created successfully!"));
})

//instrctor can see the created quizes-
export const getQuizes = funcWrapper(async (req, res) => {
    let query = {instructor: new Types.ObjectId(req.user.id)};
    const { courseId } = req.params;
    if(courseId){
        query['course']=new Types.ObjectId(courseId);
    }
    
    const quizes = await quizModel.find(query).sort({ createdAt: -1 }).select("title totalMarks timeLimit questions");

    res.status(200).json(new AppResponse(quizes));
} )


export const getQuizById = funcWrapper(async (req, res)=>{
    const {courseId, id} = req.params;
    if(!courseId || !id){
        throw new Error("Invalid path");
    }
    const quiz = await quizModel.findOne({course:courseId, _id:id}).populate("course", "title").populate("instructor", "name");
    if(!quiz){
        throw new ErrorResponse(404, "This page is not exists or Invalid url");
    }
    res.status(200).json(new AppResponse(quiz, "success"));
})


export const deleteQuiz =funcWrapper( async (req, res) => {
    const { courseId, id } = req.params;

    const quiz = await quizModel.findOneAndDelete({ _id:id, course:courseId, instructor:req.user.id});
    if (!quiz) {
        throw new ErrorResponse(404, "No quiz found");
    }

    res.status(200).json(new AppResponse(null, "Quiz deleted successfully"));
})

export const updateQuiz =funcWrapper(async (req, res) => {
        const { courseId, id } = req.params;
        let {markPerQuestion, ...quizDet} = req.body;
        const updatedQuiz = await quizModel.findOneAndUpdate(
            {_id:id, course:courseId, instructor:req.user.id},
            { $set: quizDet},
            { returnDocument: 'after', runValidators: true }
        )
        
        if (!updatedQuiz) {
            throw new ErrorResponse(404, "Quiz not found");
        }

        if(!markPerQuestion){
            markPerQuestion = (updateQuiz.totalMarks/updateQuiz.questions.length);
        }
        
        if (req.body.questions || markPerQuestion) {
            updatedQuiz.totalMarks = markPerQuestion*updatedQuiz.questions.length;
            await updatedQuiz.save();
        }

        res.status(200).json(new AppResponse(updatedQuiz, "Quiz updated successfully"));  
    }
)

export const getCourseQuizes = async (courseId)=>{
    try{
        const quizes = await quizModel.aggregate([
            {
                $match:{
                    course:courseId
                }
            },
            {
                $project:{
                    title:1,
                    createdAt:1,
                    totalMarks:1,
                    totalQuestions:{
                        $size:"$questions"
                    }
                }
            },
            {
                $sort:{
                    createdAt:-1
                }
            }
        ])
        if(!quizes){
            throw new ErrorResponse(404, "No quizes found");
        }
        return quizes;
    }catch(err){
        throw err;
    }
}
