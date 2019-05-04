const express = require('express')
const mongoose = require('mongoose')
const bodyParser = require('body-parser')
const nodemailer = require('nodemailer');
// const https = require("https");
const axios = require('axios');

const app = express()

app.use(bodyParser.urlencoded({ extended: true }))
app.use(bodyParser.json())

// mongoose.connect(process.env.MONGODB_URI);
mongoose.connect('mongodb://demo:demoadmin123@ds149596.mlab.com:49596/fb-hackathon', { useNewUrlParser: true })
mongoose.connection.on('error', (err) => {
  console.error(err)
  console.log('%s MongoDB connection error. Please make sure MongoDB is running.', chalk.red('✗'))
  process.exit()
})

app.get('/', (req, res) => {
  res.status(200).json({ message: 'api' })
})

app.post('/generate', (req, res) => {
  const { dates, criteria, people } = req.body
  console.log(dates, criteria, people)
  res.status(200).json({ message: [dates, criteria, people] })
})

app.post('/email', async (req, res) => {
  let testAccount = await nodemailer.createTestAccount();
  let transporter = nodemailer.createTransport({
    host: "smtp.mailtrap.io",
    port: 2525,
    auth: {
      user: "aab2cd4f5dce36",
      pass: "c3478de1b31297"
    }
  });
  let info = await transporter.sendMail({
    from: '"Fred Foo " <foo@example.com>', // sender address
    to: "29fe75dbfe-0ea057@inbox.mailtrap.io", // list of receivers
    subject: "Hello", // Subject line
    text: "Hello world?", // plain text body
    html: "<b>Hello world?</b>" // html body
  }).then(() => {
    res.send({'message': 'success'});
    console.log("lol");
  });
});

// should call with GET / instead
app.get('/weather', (res, req) => {
    // key = "e0089bb5191cc5c929574c9f816bba5b";
    // request = "https://api.openweathermap.org/data/2.5/weather?q=Melbourne&appid=" + key;
    request = "https://api.darksky.net/forecast/376d0c405226b9b108c454f5186a72c8/37.8267,-122.4233"
    // change the latitude and longtitude later
    axios.get(request).then(res => {return res.data}).then(data => {
      // console.log(data.daily.data[0].precipType)
      let forecasts = data.daily.data;
      forecasts.forEach(data => {
        // candidate type rain, snow, sleet
        // if null, good weather
        console.log(data.precipType);
      })
    })
});

app.listen(3000, () => console.log('listening on port 3000'))
