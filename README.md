# vacuum-controller
Web controller for vacuum cleaner.

Only Xiaomi robots are supported for now.

Gets robot token and host from consul.

# api
/start - starts the cleaning
/stop - stops the cleaning

# usage
npm install
node index.js [CONSUL_HOST] [LISTEN_PORT]