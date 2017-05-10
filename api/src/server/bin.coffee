SummonStatWatcher = require('./summonstats.coffee')
argv = require('minimist') process.argv.slice(2)

livesummarydir = argv.livesummarydir || "./livesummaries"
#
# This is how many events logwatcher writes into livesummaries.
# Must match the number logwatcher is started with.
#
livesummarymax = argv.livesummarymax || 50
#
# number of items send upon connection to allow the client
# to prime its visualization.
# Can be overwritten in connect message.
#
howmany = argv.howmany || 50
port = Number(argv.port) || 8081

console.log "Using port #{port}"
console.log "Using live summary directory #{livesummarydir}"
console.log "Assuming livesummarymax of #{livesummarymax}"
console.log "Serving a maximum of entries #{howmany}"

w = new SummonStatWatcher(livesummarydir, livesummarymax, howmany)

w.createSocketIOServer(port)
console.log "Started socket.io server"


