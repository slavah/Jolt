isNodeJS = Boolean process?.pid

if isNodeJS
  path = require 'path'
  Jolt = require path.normalize process.cwd() + '/../index'

beforeEach ->
  Jolt.globalize()

describe 'Jolt.ReceiverE', ->

  it '''
    should...
  ''', ->

    myR = receiverE()

    checkIt = []

    ###
    (myR.internalE()).updater = (value...) ->
      checkIt.push value...
      value
    ###

    myR.sendEvent 'a', 'b', 'c'

    ( expect checkIt ).toEqual [ 'a', 'b', 'c' ]
