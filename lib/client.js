module.exports = Client

var Stream = require('stream')

function Client(req, res) {
  Stream.call(this)

  this.req = req
  this.res = res

  this.legacy = req.headers['user-agent'] && false // (/^Opera/).test(req.headers['user-agent'])  
  this.writable = true
  this.readable = false

  res.once('close', this.emit.bind(this, 'close'))
  res.on('drain', this.emit.bind(this, 'drain'))

  req.socket.setNoDelay(true)
  res.writeHead(200, {'content-type': 'text/'+(this.legacy ? 'x-dom-event-stream' : 'event-stream')})
  res.write(':ok\n\n')

  this.data_header = this.legacy ? 'data:' : 'data: '
  this._id = 0
}

var cons = Client
  , proto = cons.prototype = Object.create(Stream.prototype)

proto.constructor = cons

proto.retry = function(ms) {
  this.res.write('retry: '+ms+'\n\n')
}

proto.write = function(data) {
  var response = 
      'id: '+(this._id++)+'\n\n'
    + (this.legacy ? 'Event: data\n' : '')
    + this.data_header
    + data.split('\n').join('\n'+this.data_header)+'\n\n'

  return this.res.write(response)
}

proto.end = function(data) {
  if(arguments.length) {
    this.write(data)
  }
  this.writable = false

  this.res.end('event: end\ndata: 1\n\n')
}
