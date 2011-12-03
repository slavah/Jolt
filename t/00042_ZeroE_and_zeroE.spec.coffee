isNodeJS = Boolean process?.pid

if isNodeJS
  path = require 'path'
  Jolt = require path.normalize process.cwd() + '/../index'

beforeEach ->
  Jolt.globalize()

describe 'Jolt.ZeroE', ->

  it '''
    should...
  ''', ->

    ###
    myZ = zeroE()

    ( expect -> sendEvent myZ, 1, 2, 3 ).toThrow '<ZeroE>.UPDATER: received a pulse; an instance of ZeroE should never receive a pulse'
    ###
