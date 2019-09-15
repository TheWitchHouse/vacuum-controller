'use strict'

const consul_module = require('consul')
const miio = require('miio')
const express = require('express')


if (process.argv.length != 4)
  throw "Usage: node index.js [CONSUL_HOST] [LISTEN_PORT]. \nYou've passed: " + process.argv

const listen_port = Number(process.argv[3])

if (!Number.isInteger(listen_port) || listen_port <= 0 || listen_port > 65535)
  throw "Incorrect port - expected integer between 1 and 65535, you've passed: " + process.argv[3] + ' which converts to ' + listen_port


const consul_host = process.argv[2]

const consul = consul_module( { host: consul_host, promisify: true } )

const server = express()
server.listen(listen_port, function () {
  console.info('Listening on port ' + listen_port)
})


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

const getVacuum = async function() {
  console.info("Loading configuration...")
  const host = (await consul.kv.get('the-witch-house/config/vacuum/host')).Value
  const token = (await consul.kv.get('the-witch-house/config/vacuum/token')).Value

  console.info("Connecting to vacuum " + host + "; token is " + token)
  const vacuum = await miio.device({ address: host, token: token })
  console.info("Connected to ", vacuum)
  return vacuum
}