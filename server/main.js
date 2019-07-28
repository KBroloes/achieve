const express = require('express')
require('dotenv').config();

const auth = require('./authentication')
const session = require('./session')

const app = express()
const port = 3000

const public = express.static('public')

// Configure node app
app.set('views', './server/views')
app.set('view engine', 'ejs')
app.use(public)

session.configure(app)
auth.configure(app)

app.get('/', (req, res) =>  {
    res.render('index', { user: req.user })
})

app.get('/main', auth.ensure, (req, res) =>  {
    res.render('main', { user: req.user })
})

app.listen(port, () => console.log(`Example app listening on port ${port}!`))