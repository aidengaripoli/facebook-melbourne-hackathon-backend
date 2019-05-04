const express = require('express')
const mongoose = require('mongoose')
const bodyParser = require('body-parser')
const nodemailer = require('nodemailer');
// const https = require("https");
const axios = require('axios');
const moment = require('moment')
const cors = require('cors')

const app = express()

app.use(cors())
app.use(bodyParser.urlencoded({ extended: true }))
app.use(bodyParser.json())

// mongoose.connect(process.env.MONGODB_URI);
mongoose.connect('mongodb://demo:demoadmin123@ds149596.mlab.com:49596/fb-hackathon', { useNewUrlParser: true })
mongoose.connection.on('error', (err) => {
  console.error(err)
  console.log('%s MongoDB connection error. Please make sure MongoDB is running.', chalk.red('✗'))
  process.exit()
})

const googleMapsClient = require('@google/maps').createClient({
  key: 'AIzaSyBtz626NHTfso4tPcJJE2t8rSW3H96heUk',
  Promise: Promise
})

app.get('/', (req, res) => {
  res.status(200).json({ message: 'api' })
})

app.post('/generate', async (req, res) => {
  const { startTimestamp, endTimestamp, location, criteria, people } = req.body
  
  // dates
  const startDate = moment(startTimestamp)
  const endDate = moment(endTimestamp)
  const days = endDate.diff(startDate, 'days', false)

  // hotel
  if (days > 1) {
    // need a hotel
  }

  // nearby food
  const lunchRestaurant = await getNearbyRestaurant(location.cityLatLong)
  // console.log(lunchRestaurant)

  // const lunchPhoto = await getPlacePhoto(lunchRestaurant.photos[0].photo_reference)
  // const lunchPlace = await getPlace(lunchRestaurant.place_id)
  // console.log(lunchPlace)

  // console.log(lunchPlace.photos[0].photo_reference)
  // const lunchPhoto = await getPlacePhoto(lunchPlace.photos[1].photo_reference)
  // console.log(lunchPhoto)

  const dinnerRestaurant = await getNearbyRestaurant(location.cityLatLong)

  // categories keywords
  const keywords = {
    romantic: ['beaches', 'cinemas', 'gardens', 'zoos', 'aquarium', 'rooftop bars'],
    sport: ['stadiums', 'arenas'],
    nature: [],
    historic: []
  }

  // this needs to be fixed!
  let firstCriteria = criteria[0].toLowerCase()
  let index = Math.floor(Math.random() * (keywords[firstCriteria].length - 0) + 0)
  const middayevent = await getClosestPlace(`${keywords[firstCriteria][index]} in ${location.cityName}`)

  // return the plan
  return res.status(200).json({
    plan: [
      {
        // morningevent: null,
        lunch: {
          // imageURL: lunchPhoto,
          name: lunchRestaurant.name,
          rating: lunchRestaurant.rating
        },
        middayevent: {
          name: middayevent.name
        },
        dinner: {
          // imageURL: dinnerPhoto,
          name: dinnerRestaurant.name,
          rating: dinnerRestaurant.rating
        },
        hotel: null // if required
      }
    ]
  })
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
// functions
function getPlace(placeid) {
  return googleMapsClient.place({
    placeid
  })
  .asPromise()
  .then((response) => {
    return response.json.result
  })
  .catch((err) => {
    console.log(err)
  })
}

function getClosestPlace(query, location) {
  return googleMapsClient.places({
    query,
    location,
    radius: 5000
  })
  .asPromise()
  .then((response) => {
    let index = Math.floor(Math.random() * (response.json.results.length - 0) + 0)
    return response.json.results[index]
  })
  .catch((err) => {
    console.log(err)
  })
}

function getNearbyRestaurant(location) {
  return googleMapsClient.placesNearby({
    // location: '-37.8207879,144.9561307',
    location,
    radius: 5000,
    type: 'restaurant',
    name: 'restaurant'
  })
  .asPromise()
  .then((response) => {
    let index = Math.floor(Math.random() * (response.json.results.length - 0) + 0)
    console.log(index)
    return response.json.results[index]
  })
  .catch((err) => {
    console.log(err)
  })
}

function getNearbyRestaurant(location) {
  return googleMapsClient.placesNearby({
    // location: '-37.8207879,144.9561307',
    location,
    radius: 5000,
    type: 'restaurant',
    name: 'restaurant'
  })
  .asPromise()
  .then((response) => {
    let index = Math.floor(Math.random() * (response.json.results.length - 0) + 0)
    return response.json.results[index]
  })
  .catch((err) => {
    console.log(err)
  })
}

function getPlacePhoto(photoreference) {
  return googleMapsClient.placesPhoto({
    photoreference,
    maxwidth: 400
  })
  .asPromise()
  .then((response) => {
    console.log(response.error_message)
    return response
  })
  .catch((err) => {
    console.log('PHOTO ERROR')
  })
}

app.listen(3000, () => console.log('listening on port 3000'))
