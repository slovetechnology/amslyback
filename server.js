const express = require('express')
const cors = require('cors')
const fileUpload = require('express-fileupload')
const http = require('http')

require('dotenv').config()

const app = express()
const port = process.env.PORT || 5001;

const server = http.createServer(app)

app.use(cors({
    origin: ['http://localhost:5174', 'https://amsly.netlify.app', 'http://localhost:5173']
}))
app.use(express.urlencoded({extended: true}))
app.use(express.json())
app.use(express.static('public'))
app.use(fileUpload())
app.use('/api/user', require('./routers/users'))
app.use('/api/subscription', require('./routers/subscription'))
app.use('/api/bills', require('./routers/bills'))
app.use('/api/transactions', require('./routers/transactions'))
app.use('/api/notify', require('./routers/notify'))

server.listen(port, () => console.log(`Server listening on localhost:${port}`))
// cpanel ftp password = amsly2023-server