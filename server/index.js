const path = require('path')
const express = require('express')
const morgan = require('morgan')
const session = require('express-session')
const passport = require('passport')
const SequelizeStore = require('connect-session-sequelize')(session.Store)
const db = require('./db')
const sessionStore = new SequelizeStore({db})
const app = express()
const PORT = process.env.PORT || 3001
const User = require('./db/models/user')

passport.serializeUser((user, done) => done(null, user.id))

passport.deserializeUser(async (id, done) => {
  try {
    const user = await User.findByPk(id)
    done(null, user)
  } catch (err) {
    done(err)
  }
})

app.use(morgan('dev'))
app.use(express.urlencoded({extended: true}))
app.use(express.json())

app.use(
  session({
    secret: process.env.SESSION_SECRET || 'my best friend is Cody',
    store: sessionStore,
    resave: false,
    saveUninitialized: false
  })
)
app.use(passport.initialize())
app.use(passport.session())

app.use('/auth', require('./auth'))
app.use('/api', require('./api'))

app.use(express.static(path.join(__dirname, '..', 'build')))

app.get('*', (req, res, next) => {
  res.sendFile(path.join(__dirname, '..', 'build/index.html'))
})
app.use((err, req, res, next) => {
  res.status(err.status || 500)
  res.send(err.message || 'INTERNAL SERVER ERROR')
})
db.sync()
  .then(function() {
    return sessionStore.sync()
  })
  .then(function() {
    app.listen(PORT, () => {
      console.log(`LISTENING ON PORT ${PORT}`)
    })
  })
