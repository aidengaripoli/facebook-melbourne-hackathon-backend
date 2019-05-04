const express = require('express')

const app = express()

app.use('/', (req, res) => {
  res.status(200).json({ message: 'working' })
})

app.listen(3000, () => console.log('listening on port 3000'))
