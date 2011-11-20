{spawn, exec} = require 'child_process'

task 'docs', 'rebuild the internal documentation', ->

  (exec [
    'docco lib/*.coffee'
    'lib/Behavior/*.coffee'
    'lib/EventStream/*.coffee'
    'lib/helpers/say.coffee'
    'lib/packaging/exporter.coffee'
    'lib/Pulse/*.coffee'
  ].join(' '), (err) ->
    throw err if err).stdout.pipe process.stdout
