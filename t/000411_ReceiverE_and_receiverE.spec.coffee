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

    (myR.internalE()).updater = (value...) ->
      checkIt.push value...
      value


    #myE = myR.internalE()

    ###
    myEU = myE.UPDATER
    myE.UPDATER = (pulse) ->
      checkIt.push pulse.value...
      myEU.call myE, pulse
    ###

    myR.sendEvent 'a', 'b', 'c'

    ( expect checkIt ).toEqual [ 'a', 'b', 'c' ]
