const express = require('express')
const mongoose = require('mongoose')
const bodyParser = require('body-parser')
const moment = require('moment')

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

const googleMapsClient = require('@google/maps').createClient({
  key: 'AIzaSyBtz626NHTfso4tPcJJE2t8rSW3H96heUk',
  Promise: Promise
})

app.get('/', (req, res) => {
  res.status(200).json({ message: 'api' })
})

app.post('/generate', async (req, res) => {
  const { startTimestamp, endTimestamp, location, criteria, people } = req.body
  // location -> { cityName: '', cityLatLong: ',' }
  console.log(startTimestamp, endTimestamp, criteria, people)
  
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
  const dinnerRestaurant = await getNearbyRestaurant(location.cityLatLong)

  console.log(lunchRestaurant)

  // categories keywords
  const keywords = {
    romantic: ['beaches', 'cinemas', 'gardens'],
    sport: ['stadiums', 'arenas'],
    nature: [],
    historic: []
  }

  const middayevent = await getNearbyPlace(`${keywords[criteria]} in ${location.cityName}`)

  // return the plan
  res.status(200).json({
    plan: [
      {
        // morningevent: null,
        lunch: {
          name: lunchRestaurant.name,
          rating: lunchRestaurant.rating
        },
        middayevent: null,
        dinner: {
          name: dinnerRestaurant.name,
          rating: dinnerRestaurant.rating
        },
        hotel: null // if required
      }
    ]
  })
})

// functions
function getNearbyPlace(query, location) {
  return googleMapsClient.places({
    query,
    // location: '-37.8207879,144.9561307',
    location,
    radius: 500
  })
  .asPromise()
  .then((response) => {
    return response.json.results[0]
  })
  .catch((err) => {
    console.log(err)
  })
}

function getNearbyRestaurant(location) {
  return googleMapsClient.placesNearby({
    // location: '-37.8207879,144.9561307',
    location,
    radius: 500,
    type: 'restaurant',
    name: 'restaurant'
  })
  .asPromise()
  .then((response) => {
    // console.log(response.json.results.length)
    let index = Math.floor(Math.random() * (response.json.results.length - 0) + 0)
    console.log(index)
    // response.json.results[index].name
    // console.log(response.json.results[index].name)
    return response.json.results[index]
  })
  .catch((err) => {
    console.log(err)
  })
}

app.listen(3000, () => console.log('listening on port 3000'))
