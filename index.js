const settings = require('./settings')

const consul = require('consul')( { host: settings.consul_host, promisify: true } )
const miio = require('miio')
const express = require('express')

const getVacuum = async function() {
  console.info("Loading configuration...")
  const host = (await consul.kv.get('the-witch-house/config/vacuum/host')).Value
  const token = (await consul.kv.get('the-witch-house/config/vacuum/token')).Value

  console.info("Connecting to vacuum " + host + "; token is " + token)
  const vacuum = await miio.device({ address: host, token: token })
  console.info("Connected to ", vacuum)
  return vacuum
}

const withVacuum = async function(job) {
  var vacuum = await getVacuum()
  try {
    await job(vacuum)
  }
  finally {
    console.info("Disconnecting...")
    vacuum.destroy()
    console.info("Disconnected...")
  }
}

const server = express()
server.get('/start', async function (request, response) {
  console.info('Starting the vacuum...')
  await withVacuum(async function(vacuum) {
    await vacuum.activateCleaning()
    console.info('Started the cleaning successfully...')
  })
  response.send('OK')
})

server.get('/stop', async function (request, response) {
  console.info('Stopping the vacuum...')

  await withVacuum(async function(vacuum) {
    await vacuum.activateCharging()
    console.info('Stopped the cleaning successfully...')
  })
  response.send('OK')
})
      
server.listen(settings.listening_port, function () {
  console.info('Listening on port ' + settings.listening_port)
})