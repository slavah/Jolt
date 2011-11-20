isNodeJS = Boolean process?.pid

if isNodeJS
  path = require 'path'
  Jolt = require path.normalize process.cwd() + '/../index'

describe 'Sanity', ->

  it '''
    Jolt should be defined
  ''', ->

    ( expect Jolt ).toBeTruthy()


  it '''
    Jolt should be an object
  ''', ->

    ( expect typeof Jolt ).toEqual 'object'


  it '''
    Jolt should have an _ [underscore] property
  ''', ->

    ( expect Jolt._ ).toBeTruthy()


  it '''
    Jolt should have an EventEmitter2 property
  ''', ->

    ( expect Jolt.EventEmitter2? ).toBeTruthy()


  it '''
    Jolt should have a globalize method
  ''', ->

    ( expect typeof Jolt.globalize ).toEqual 'function'
