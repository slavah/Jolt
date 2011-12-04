isNodeJS = Boolean process?.pid

if isNodeJS
  path = require 'path'
  Jolt = require path.normalize process.cwd() + '/../index'

beforeEach ->
  Jolt.globalize()

describe 'Jolt.OneE_high', ->

  it '''
    should...
  ''', ->

    checkIt = []

    (oneE 4, 5, 6).internalE().updater = (value...) ->
      checkIt.push value...
      value

    (oneE_high 1, 2, 3).internalE().updater = (value...) ->
      checkIt.push value...
      value

    waitsFor ->
      checkIt.length is 6

    runs ->
      ( expect checkIt ).toEqual [ 1, 2, 3, 4, 5, 6 ]
