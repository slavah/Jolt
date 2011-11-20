isNodeJS = Boolean process?.pid

if isNodeJS
  path = require 'path'
  Jolt = require path.normalize process.cwd() + '/../index'

describe 'Jolt.globalize', ->
  ###
  it '''
    _ [underscore] should not be defined globally before calling Jolt.globalize
  ''', ->

    ( expect _? ).not.toBe Jolt._


  it '''
    calling Jolt.globalize should export Jolt._ [underscore] to global _
    [underscore]
  ''', ->

    Jolt.globalize()
    ( expect _ ).toBe Jolt._
  ###
