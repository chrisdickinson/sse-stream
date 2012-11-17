# sse-stream

Expose [HTML5 Server Sent Events](https://developer.mozilla.org/en-US/docs/Server-sent_events/Using_server-sent_events) as an installable appliance on Node.JS `http` servers; connections are emitted as [Writable streams](https://github.com/dominictarr/stream-spec/blob/master/stream_spec.md#writablestream).

```javascript

var http = require('http')
  , fs = require('fs')
  , through = require('through')
  , sse = require('sse-stream')('/sse')
  , serv

module.exports = serv = http.createServer(function(req, resp) {
  resp.setHeader('content-type', 'text/html')
  resp.end('<html><body><script type="text/javascript">('+js+')()</script></body></html>')
})

sse.install(serv)

sse.on('connection', function(client) {
  fs.createReadStream('/usr/share/dict/words')
    .pipe(through(function(buf) { this.emit('data', buf.toString()) }))
    .pipe(client)
})

// client-side code:
function js() {
  var es = new EventSource('/sse')
    , pre = document.createElement('pre')
    , closed = false

  document.body.appendChild(pre)

  es.onmessage = function(ev) {
    if(closed) return

    pre.appendChild(document.createTextNode(ev.data))

    window.scrollTo(0, pre.clientHeight)
  }

  es.addEventListener('end', function() {
    es.close()
    closed = true
  }, true)

  es.onerror = function(e) {
    closed = true
  }
}

```

# API

### sse = require('sse-stream')(path | options)

Create a SSE server that emits `connection` events on new, successful eventstream connections.

The argument may either be a string `path` to listen on (defaults to `/sse/`) or an object:

```javascript
{ path: '/listen/on/this/path'
, keepalive: 1000 }
``` 

`keepalive` determines the interval time in ms that keepalives will be sent to all connected clients.

### sse.on('connection', function(client))

`client` is a writable stream representing a client connection (request response pair).

Of note, all data sent through this connection will be stringified before sending due to
the event stream spec.

### client.retry(integer ms)

Send a "retry" message that lets the client know how many MS to wait until retrying a connection that ended.

# license

MIT
