const express = require('express')
const multer = require('multer')
const cors = require('cors')
const router = require('./router/router.js')
const port = 3001
const app = express()
const form = multer()


app.use(cors({origin: true, credentials: true}));
app.use(express.json())


app.use(express.urlencoded({ extended: true }))
app.use(router)
app.listen(port ,"localhost", () => console.log(`Example app listening on port ${port}!`))