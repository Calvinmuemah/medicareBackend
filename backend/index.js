require('dotenv').config();
const express = require('express');
const mongoose = require('./config/db');
const userRoutes = require("./Routes/userRoutes");

const app = express();
app.use(express.json());
app.use(require('cors')());
app.use("/v1/api",userRoutes)




const PORT = process.env.PORT;
app.listen(PORT,async()=>{
    try {
        console.log(`Server running on port ${PORT}`)
    } catch (error) {
        
    }
})
