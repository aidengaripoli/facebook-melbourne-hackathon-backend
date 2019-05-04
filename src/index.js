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
// mongoose.connect('mongodb://demo:demoadmin123@ds149596.mlab.com:49596/fb-hackathon', { useNewUrlParser: true })
// mongoose.connection.on('error', (err) => {
//   console.error(err)
//   console.log('%s MongoDB connection error. Please make sure MongoDB is running.', chalk.red('✗'))
//   process.exit()
// })

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
  const numDays = endDate.diff(startDate, 'days', false)

  // hotel
  let hotel = null
  if (numDays > 1) {
    // need a hotel
    nearbyHotel = await getNearbyHotel(location.cityLatLong)
    hotel = { name: nearbyHotel.name, nights: numDays - 1 }
  }

  let days = []
  let forecasts = []
  for (let i = 0; i < numDays; i++) {
    let newDay = await generateDay(location, criteria)
    newDay.date = startTimestamp + (i * 86400000)
    days.push(newDay)
    forecasts.push(await getWeatherForecast(location.cityLatLong));
  }

  // return the plan
  return res.status(200).json({ plan: days, weather: forecasts, hotel })
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
  let data = [{
    day: "2019-05-09",
    place: [{name: 'n1', image: "example.com"}, {name: 'n2', image:"example.com"}],
    hotel: "hotelname",
    weather: "sunny"
  }]
  let content = "";
  data.forEach(item => {
     content += "<b>"+ item.day +"</b>";
     item.place.forEach(place => {
       content += "<p>" + place.name + "</p>";
       content += "<img src=" + place.image + ">"
     })
  });
  let info = await transporter.sendMail({
    from: '"Fred Foo " <foo@example.com>', // sender address
    to: "29fe75dbfe-0ea057@inbox.mailtrap.io", // list of receivers
    subject: "Hello", // Subject line
    text: "Hello world?", // plain text body
    html: content
    // html: "<b>Hello world?</b>" // html body
  }).then(() => {
    res.send({'message': 'success'});
    console.log("lol");
  });
});

// functions
async function generateDay(location, criteria) {
  // nearby food
  const lunchRestaurant = await getNearbyRestaurant(location.cityLatLong)
  const dinnerRestaurant = await getNearbyRestaurant(location.cityLatLong)

  // categories keywords
  const keywords = {
    romantic: ['beaches', 'cinemas', 'gardens', 'zoos', 'aquarium', 'rooftop bars'],
    sport: ['stadiums', 'arenas', 'sports', 'recreation']
  }

  // this needs to be fixed!
  let firstCriteria = criteria[0].toLowerCase()
  let index = Math.floor(Math.random() * (keywords[firstCriteria].length - 0) + 0)
  const middayevent = await getClosestPlace(`${keywords[firstCriteria][index]} in ${location.cityName}`)

  return {
    lunch: {
      time: ['12:00pm', '1:30pm'],
      name: lunchRestaurant.name,
      rating: lunchRestaurant.rating,
      photo: `https://maps.googleapis.com/maps/api/place/photo?maxwidth=300&photoreference=${lunchRestaurant.photos[0].photo_reference}&key=AIzaSyBtz626NHTfso4tPcJJE2t8rSW3H96heUk`
    },
    middayevent: {
      time: ['2:00pm', '4:30pm'],
      name: middayevent.name,
      photo: `https://maps.googleapis.com/maps/api/place/photo?maxwidth=300&photoreference=${middayevent.photos[0].photo_reference}&key=AIzaSyBtz626NHTfso4tPcJJE2t8rSW3H96heUk`
    },
    dinner: {
      time: ['5:30pm', '7:00pm'],
      name: dinnerRestaurant.name,
      rating: dinnerRestaurant.rating,
      photo: `https://maps.googleapis.com/maps/api/place/photo?maxwidth=300&photoreference=${dinnerRestaurant.photos[0].photo_reference}&key=AIzaSyBtz626NHTfso4tPcJJE2t8rSW3H96heUk`
    }
  }
}

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

function getNearbyHotel(location) {
  return googleMapsClient.placesNearby({
    location,
    radius: 5000,
    type: 'hotel',
    name: 'hotel'
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

function getWeatherForecast(location) {
  request = "https://api.darksky.net/forecast/376d0c405226b9b108c454f5186a72c8/" + location;
  // change the latitude and longtitude later
  return axios.get(request).then(res => {return res.data}).then(data => {
    // console.log(data.daily.data[0].precipType)
    let forecasts = data.daily.data;
    let weathers = [];
    forecasts.forEach(data => {
      weathers.push(data.precipType);
    });
    return weathers;
  })
}

app.listen(3000, () => console.log('listening on port 3000'))
