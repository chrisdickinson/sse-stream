module.exports = sse

var through = require('through')

function sse(at) {
  var es = new EventSource(at || '/sse')
    , stream = through()

  es.onmessage = function(ev) {
    if(closed) return

    stream.queue(ev.data)
  }

  es.addEventListener('end', function() {
    es.close()
    closed = true
    stream.queue(null)
  }, true)

  es.onerror = function(e) {
    closed = true
    stream.emit('error', e)
  }

  return stream
}
