import mongoose  from 'mongoose';
import userModel from './user.model.js';

const courseSchema=new mongoose.Schema({
    title:{
        type:String,
        required:true
    },
    category:{
        type:String,
        enum:["professional","beginner","advanced"],
        required:true
    },
    rating:{
        totalUsers:{
            type:Number,
            default:0
        },
        average:{
            type: mongoose.Schema.Types.Decimal128,
            max:5.0,
            default:0.0
        }
    },
    feedback:[
        {
            name:String,
            message:String,
        }
    ],
    description:{
        type:String,
        required:true
    },
    instructor:{
        type: mongoose.Types.ObjectId,
        required:true , 
        ref:"users"
    },
    imageUrl:{
        type:String,
        required:true
    }
},
{
    timestamps:true
})

courseSchema.pre("save",async function(){
    const instructor= await userModel.findById(new mongoose.Types.ObjectId(this.instructor));
    if(!instructor) throw "invalid instructor";

    const course = await this.constructor.findOne({title:this.title, category:this.category, instructor:this.instructor});
    if(course){
        throw `course already exists with ${this.title} ${this.category}`;
    }
    
})

courseSchema.index({title:1, category:1, instructor:1}, {unique: true});

export default mongoose.model("courses", courseSchema);