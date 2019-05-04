const express = require('express')
const mongoose = require('mongoose')

const app = express()

// mongoose.connect(process.env.MONGODB_URI);
mongoose.connect('mongodb://demo:demoadmin123@ds149596.mlab.com:49596/fb-hackathon', { useNewUrlParser: true })
mongoose.connection.on('error', (err) => {
  console.error(err)
  console.log('%s MongoDB connection error. Please make sure MongoDB is running.', chalk.red('✗'))
  process.exit()
})

app.use('/', (req, res) => {
  res.status(200).json({ message: 'working' })
})

app.listen(3000, () => console.log('listening on port 3000'))
