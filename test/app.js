var http = require('http')
  , fs = require('fs')
  , through = require('through')
  , sse = require('./lib/server')('/sse')
  , brake = require('brake')
  , serv

module.exports = serv = http.createServer(function(req, resp) {
  resp.setHeader('content-type', 'text/html')
  resp.end('<html><body><script type="text/javascript">('+js+')()</script></body></html>')
})

sse.install(serv)

sse.on('connection', function write(client) {
  fs.createReadStream('/usr/share/dict/words')
    .pipe(through(function(buf) { this.emit('data', buf.toString()) }))
    .pipe(client)
})

function js() {
  var es = new EventSource('/sse')
    , pre = document.createElement('pre')
    , closed = false

  document.body.appendChild(pre)

  es.onmessage = function(ev) {
    if(closed) return console.error('ALREADY CLOSED')

    pre.appendChild(document.createTextNode(ev.data))

    window.scrollTo(0, pre.clientHeight)
  }

  es.addEventListener('end', function() {
    es.close()
    closed = true
  }, true)

  es.onerror = function(e) {
    console.error(e)
    closed = true
  }
}
