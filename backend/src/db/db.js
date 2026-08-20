import mongoose from "mongoose";
import { DB_NAME } from "../../constant.js";


const connectDB=async ()=>{
    try {
        const connectionInstance=await mongoose.connect(`${process.env.DB_URI}${DB_NAME}`)
    } catch (error) {
        console.log("Mongo DB connection failed.Error: ",error)
        throw error
    }
}

export default connectDB