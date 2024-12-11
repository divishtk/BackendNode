//require('dotenv').config({path:'./env'})
import connectDB from "./db/index.js";
import dotenv from "dotenv";

dotenv.config({
    path:'./env'
})


connectDB()














/*
import express from "express";


const app = express();

const connectDB = async () =>{
        try{
            mongoose.connect(`${process.env.MONGODB_URL}/${DB_NAME}`);
            app.on("Error",(error)=>{
                console.log("Error",error);
                throw error;
            })

            app.listen(process.env.PORT,()=>{
                console.log(`App listening on port ${process.env.PORT}`)
            })
        }
        catch(err){
            console.log("ERROR",err);
            throw err;
        }
}

*/