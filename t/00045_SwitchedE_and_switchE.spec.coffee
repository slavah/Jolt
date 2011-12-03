isNodeJS = Boolean process?.pid

if isNodeJS
  path = require 'path'
  Jolt = require path.normalize process.cwd() + '/../index'

beforeEach ->
  Jolt.globalize()

describe 'Jolt.SwitchedE', ->

  it '''
    should...
  ''', ->

    expect(true).toBe(true)


