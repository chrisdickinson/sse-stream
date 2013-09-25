module.exports = Server

var URL = require('url')
  , EE = require('events').EventEmitter
  , Client = require('./client')

function Server(options) {
  if(this.constructor !== Server)
    return new Server(options)

  EE.call(this)

  options = options || {path: '/sse', fallback: true, keepalive: 1000}
  options = typeof options === 'string' ? {path: options, fallback: true, keepalive: 1000} : options
  this.options = options
  this.pool = []
  this.interval = null
}

var cons = Server
  , proto = cons.prototype = Object.create(EE.prototype)

proto.constructor = cons

proto.install = function(server) {
  var self = this
    , listeners = server.listeners('request')
    , options = self.options

  server.removeAllListeners('request')

  server.on('request', on_request)

  server.once('listening', function() {
    self.interval = setInterval(function() {
      for(var i = 0, len = self.pool.length; i < len; ++i) {
        self.pool[i].res.write(':keepalive '+Date.now()+'\n\n')
      }
    }, self.options.keepalive)

    server.once('close', function() {
      clearInterval(self.interval)
      self.interval = null  
    })
  })

  self.install = function() { throw new Error('cannot install twice') }  

  return self
  
  function on_request(req, resp) {
    var okay = is_okay(req)

    if(!okay) {
      return defaultresponse(req, resp)
    }

    return self.handle(req, resp)
  } 

  function defaultresponse(req, resp) {
    for(var i = 0, len = listeners.length; i < len; ++i) {
      listeners[i].call(server, req, resp)
    }
  }

  function is_okay(req) {
    var is_okay = req.method === 'GET'
      , accept = req.headers.accept || ''

    is_okay = is_okay && (!!~accept.indexOf('text/event-stream') || !!~accept.indexOf('text/x-dom-event-stream'))

    is_okay = is_okay && URL.parse(req.url).pathname === options.path

    return is_okay
  }
}

proto.handle = function(req, resp) {
  var client = new Client(req, resp)
    , self = this
    , idx = self.pool.push(client) - 1

  self.emit('connection', client)

  client.once('close', function() {
    self.pool.splice(idx, 1)    
  })
}
