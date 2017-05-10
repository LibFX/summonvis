#
# This is a node.js server that servers Summon statistics
#
sio             = require('socket.io')
{EventEmitter}  = require('events')
fs              = require('fs')
{Inotify}       = require('inotify')
async           = require('async')
Barrier         = require('./barrier')
util            = require('util')

#
# Read a file, parse as JSON, and cache.
#
class JSONObjectCache
    constructor : () ->
        @cache = { }

    get : (fname, callback) ->
        if fname of @cache
            callback null, @cache[fname]
        else
            fs.readFile fname, (err, content) =>
                if not err
                    @cache[fname] = content = JSON.parse(content)
                callback err, content
            
#
# Send key/content to client, wrapped in JSON
#
SendContent = (client, key, content) ->
    client.socket.emit 'data',
        key  : key
        data : content

#
# Read all files from a directory that a client is interested in
# Call perfilecallback for each file
# Call alldonecallback once all files are read
#
GetDirectoryContent = (cache, client, directory, perfilecallback, alldonecallback) ->
    alldone = new Barrier(alldonecallback)

    fs.readdir directory, (err, files) ->
        if !files
            return
        allsubmitted = alldone.add()
        for file in files
            if file in client.keys
                do (file) ->
                    filereadinprogress = alldone.add()
                    fname = "#{directory}/#{file}"
                    cache.get fname, (err, content) ->
                        perfilecallback err, file, content
                        filereadinprogress.finish()
        allsubmitted.finish()

#
# Read a directories' content and send data to client right away
#
GetAndSendDirectoryContent = (cache, client, directory) ->
    GetDirectoryContent cache, client, directory, (err, file, content) ->
        if not err
            SendContent client, file, content
    , ->

SendLastEvents = (client, livesummarynow, livesummarydir, livesummarymax, howmany) ->
    fs.readlink livesummarynow, (err, target) ->
        if target == undefined
            return

        last  = Number(target)

        # send last n records, in chronological order
        inparallel = []
        cache = new JSONObjectCache()
        for i in [(howmany-1)..0]
            do (i) ->
                inparallel.push (callwhendirectorydone) ->
                    items = []
                    GetDirectoryContent cache, client, "#{livesummarydir}/#{((last - i + livesummarymax) % livesummarymax)}", (err, file, content) ->
                        if not err
                            items.push
                                file : file
                                content : content
                    , () ->
                        callwhendirectorydone null, (nextcb) ->
                            for item in items
                                SendContent client, item.file, item.content

                            nextcb()

        async.parallel inparallel, (err, results) ->
            async.series(results)
                    
class SummonStatWatcher extends EventEmitter
    constructor : (livesummarydir, livesummarymax, howmany) ->
        @livesummarymax = livesummarymax || 100
        @howmany = howmany || 50
        @livesummarydir = livesummarydir || "./livesummaries"
        @livesummarynow = livesummarydir + "/now"

        @clients = { }
        @inotify = new Inotify()
        @inotify.addWatch
            path:   livesummarydir
            watch_for: Inotify.IN_CREATE
            callback: (ev) =>
                if ev.name == "now"         # a new click was recorded
                    fs.readlink @livesummarynow, (err, target) =>
                        # if logwatcher updates 'now', readlink may fail
                        if target == undefined
                            return

                        cache = new JSONObjectCache()
                        for clientid, client of @clients
                            console.log "#{new Date()} Broadcasting update to client #{client.keys} , #{target}!!!"
                            GetAndSendDirectoryContent cache, client, "#{@livesummarydir}/#{target}"

    createSocketIOServer : (http) ->
        io = sio.listen(http)
        io.sockets.on 'connection', (socket) =>
            socket.on 'disconnect', () =>
                console.log "#{new Date()} client disconnected"
                delete @clients[socket.id]

            socket.on 'subscribe', (msg) =>
                if msg.constructor == Array
                    # old style
                    keys = msg
                    howmany = @howmany
                else
                    # new style
                    { keys : keys, sendlastnevents: howmany } = msg

                client =
                    socket : socket
                    keys   : keys

                @clients[socket.id] = client
                peer = socket.request.connection.remoteAddress
                console.log "#{new Date()} client at #{peer} subscribed to #{keys}, sending #{howmany} last events"
                
                SendLastEvents(client, @livesummarynow, @livesummarydir, @livesummarymax, howmany)

        return io

module.exports = SummonStatWatcher
