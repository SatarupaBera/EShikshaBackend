import FileModel from '../models/file.model.js';
import crypto from 'crypto';
import { funcWrapper } from '../util/wraperFunction.js';
import { ErrorResponse } from '../util/ErrorResponse.js';

const getHash = (buffer) => {
    return crypto.createHash('sha256').update(buffer).digest('hex');
}

export const downloadAssignmentFile = funcWrapper( async (req, res) => {
    
    const id = req.params.id;
    const file = await FileModel.findOne({ _id: id });

    if (!file) {
        return new ErrorResponse(404, "File not found");
    }

    res.set({
        'Content-Type': file.fileType,
        'Content-Disposition': `attachment; filename="${file.fileName}"`
    })

    res.send(file.fileData);
})


export const uploadAssignmentFile = async ( req ) => {
    if (req.file) {
        
        const bufferHash = getHash(req.file.buffer);

        let file = await FileModel.findOne({ hashedData: bufferHash });

        if (!file) {

            file = await new FileModel({
                fileName: req.file.originalname,
                fileType: req.file.mimetype,
                fileData: req.file.buffer,
                hashedData: bufferHash
            }).save();
        }

        return file._id;
    }
    throw new Error("No file selected");
}