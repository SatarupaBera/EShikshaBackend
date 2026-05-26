import mongoose from 'mongoose';


const FileSchema=new mongoose.Schema({
    fileData: {
        type: Buffer, 
        required: false
    },
    fileName: {
        type: String, 
        required: false
    },
    fileType: {
        type: String, 
        default: 'application/pdf'
    },
    hashedData: { 
        type:String,
        unique:true,
        index:true,
    }
},{ 
    timestamps:true
})


export default mongoose.model('files',FileSchema);