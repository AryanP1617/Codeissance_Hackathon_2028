import 'dotenv/config'

import app from "./app.js"
import connectDB from './src/db/db.js'

connectDB()
.then(()=>{
    app.listen(process.env.PORT||8000,()=>{
        console.log(`Server successfully connected at ${process.env.PORT}`)
    })
})
.catch((err)=>{
    console.log("MongoDb connection has failed!!!")
})  
    