import  { Schema, model } from "mongoose";
import crypto from 'crypto';

const userSchema = new Schema({
    email:{
        type:String,
        required:true,
        unique:true,
        match: [/^\S+@\S+\.\S+$/, "Please enter a valid email address"]
    },
    name:{
        type:String,
        required:true,
        minLength:3
    },
    password:{
        type:String,
        required:true
    },
    role:{
        type:String,
        enum:["ADMIN", "INSTRUCTOR", "STUDENT"],
        default:"STUDENT"
    }
},{
    timestamps:true
});

userSchema.pre('save', function(){
    this.password = crypto.hash('sha256',this.password);
})

userSchema.methods.isCorrectPassword = function (givenPassword){
    if(crypto.hash('sha256', givenPassword)==this.password){
        return true;
    }
    return false;
}

export default model('users', userSchema);