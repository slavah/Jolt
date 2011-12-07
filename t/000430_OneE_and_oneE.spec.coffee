isNodeJS = Boolean process?.pid

if isNodeJS
  path = require 'path'
  Jolt = require path.normalize process.cwd() + '/../index'

beforeEach ->
  Jolt.globalize()

describe 'Jolt.OneE', ->

  it '''
    should...
  ''', ->

    checkIt = []

    up = (value...) ->
      checkIt.push value...
      value

    (oneE 1, 2, 3).internalE().updater = up
    (oneE 'a', 'b', 'c').internalE().updater = up
    (oneE 4, 5, 6).internalE().updater = up

    waitsFor ->
      checkIt.length is 9

    runs ->
      ( expect checkIt ).toEqual [ 1, 2, 3, 'a', 'b', 'c', 4, 5, 6 ]
