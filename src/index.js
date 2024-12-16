//require('dotenv').config({path:'./env'})
import connectDB from "./db/index.js";
import dotenv from "dotenv";
import { app } from "./app.js";

dotenv.config({
  path: "./env",
});

connectDB()
  .then(() => {
    app.listen(process.env.PORT || 6969, () => {
      console.log(`Server is running on port ${process.env.PORT}`);
    });
  })
  .catch((err) => {
    console.log("Mongo Connection failed", err);
  });

/*


// "dev": "nodemon -r dotenv/config --experimental-json-modules hi.js"












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
