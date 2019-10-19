'use strict'

const consul_module = require('consul')
const miio = require('miio')
const express = require('express')

const listen_port = 8080

if (process.argv.length != 5)
  throw "Usage: node index.js [CONSUL_HOST] [GELF_HOST] [GELF_PORT]. \nYou've passed: " + process.argv

const consul_host = process.argv[2]
const consul = consul_module( { host: consul_host, promisify: true } )

const gelf_host = process.argv[3]
const gelf_port = process.argv[4]

var logger = getLogger(gelf_host, gelf_port)

const server = express()
server.listen(listen_port, function () {
  logger.info('Listening on port ' + listen_port)
})


server.get('/start', async function (request, response) {
  logger.info('Starting the vacuum...')
  await withVacuum(async function(vacuum) {
    await vacuum.activateCleaning()
    logger.info('Started the cleaning successfully...')
  })
  response.send('OK')
})

server.get('/stop', async function (request, response) {
  logger.info('Stopping the vacuum...')

  await withVacuum(async function(vacuum) {
    await vacuum.activateCharging()
    logger.info('Stopped the cleaning successfully...')
  })
  response.send('OK')
})


function getLogger(host, port) {
  const winston = require('winston')
  const winston_gelf = require('winston-gelf')

  const options = {
    gelfPro: {
      fields: {
        source: 'vacuum-controller'
      },
      adapterOptions: {
        host: host,
        port: port
      }
    }
  }

  return winston.createLogger({
    transports: [
      new winston.transports.Console(),
      new winston_gelf(options)
    ]
  });
}

const withVacuum = async function(job) {
  var vacuum = await getVacuum()
  try {
    await job(vacuum)
  }
  finally {
    logger.info("Disconnecting...")
    vacuum.destroy()
    logger.info("Disconnected...")
  }
}

const getVacuum = async function() {
  logger.info("Loading configuration...")
  const host = (await consul.kv.get('the-witch-house/config/vacuum/host')).Value
  const token = (await consul.kv.get('the-witch-house/config/vacuum/token')).Value

  logger.info("Connecting to vacuum " + host + "; token is " + token)
  const vacuum = await miio.device({ address: host, token: token })
  logger.info("Connected to ", vacuum)
  return vacuum
}