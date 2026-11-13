import express from "express"

app = express();

PORT = process.env.PORT || 3000

app.listen(3000, ()=>{
    console.log(`App running on Port : ${PORT}`)
})