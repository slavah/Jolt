{spawn, exec} = require 'child_process'

task 'docs', 'rebuild the internal documentation', ->

  (exec 'docco lib/*.coffee', (err) ->
    throw err if err).stdout.pipe process.stdout

  (exec 'docco lib/Behavior/*.coffee', (err) ->
    throw err if err).stdout.pipe process.stdout

  (exec 'docco lib/EventStream/*.coffee', (err) ->
    throw err if err).stdout.pipe process.stdout

  (exec 'docco lib/packaging/exporter.coffee', (err) ->
    throw err if err).stdout.pipe process.stdout

  (exec 'docco lib/Pulse/*.coffee', (err) ->
    throw err if err).stdout.pipe process.stdout

