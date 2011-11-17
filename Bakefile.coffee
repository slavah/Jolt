# Bakefile.coffee works in conjunction with the "halfbake" build-test tool:
# https://github.com/michaelsbradleyjr/halfbake

fs     = require 'fs'
path   = require 'path'
_      = require 'underscore'
events = require 'events'
minify = require 'uglify-js'
async  = require 'async'
CoffeeScript = require 'coffee-script'

read   = (path, callback) -> fs.readFile ('./lib/' + path), 'utf8', callback

readI = (path, callback) ->
  read path, (err, src) ->
    indented = ('  ' + line for line in (src.split '\n')).join '\n'
    callback(null, indented)

readCI = (path, callback) ->
  read path, (err, src) ->
    compiled = (CoffeeScript.compile src, { bare: true }).split '\n'
    indented = ('  ' + line for line in compiled).join '\n'
    callback(null, indented)

CI = (src) ->
  compiled = (CoffeeScript.compile src, { bare: true }).split '\n'
  indented = ('  ' + line for line in compiled).join '\n'

Baker = module.exports = new events.EventEmitter

#-------#

async.parallel(
  licensing: ((callback) -> read 'packaging/licensing.js', callback)

  topSrc: ((callback) -> read 'packaging/top.js', callback)

  helpersJS: ((callback) -> async.parallel(_([

    'helpers/eventemitter2.mymod.js'
    'helpers/sizzle.mymod.js'
    'helpers/underscore.mymod.js'
    'helpers/underscore.string.mymod.js'

  ]).map((path) -> ((callback) -> readI path, callback))

  , (err, sources) ->
    callback(null, sources.join '\n')))

  compiledSrc: ((callback) -> async.parallel(_([

    'helpers/BinaryHeap.mymod.coffee'
    'Jolt.coffee'
    'PriorityQueue.coffee'
    'Pulse.coffee'
    'EventStream.coffee'
    'EventStream/EventStream_api.coffee'
    'EventStream/InternalE.coffee'
    'EventStream/ConcatE.coffee'
    'EventStream/MappedE.coffee'
    'Pulse/Pulse_cat.coffee'
    'Behavior.coffee'
    'Reactor.coffee'
    'packaging/exporter.coffee'

  ]).map((path) -> ((callback) -> read path, callback))

  , (err, sources) ->
    callback(null, CI(sources.join '\n'))))

  bottomSrc: ((callback) -> read 'packaging/bottom.js', callback)

# -- FINALLY -- #

, (err, sources) ->

  index = [ sources.licensing, sources.topSrc, sources.helpersJS, sources.compiledSrc, sources.bottomSrc ].join '\n'
  indexNoTB = [ sources.helpersJS, sources.compiledSrc ].join '\n'

  bundles =

    './index.js': index
    './bundles/Jolt.min.js': [ sources.licensing, sources.topSrc, ('  ' + (minify indexNoTB)), sources.bottomSrc].join ''

  Baker.emit 'baked', bundles)
