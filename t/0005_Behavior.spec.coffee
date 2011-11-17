isNodeJS = Boolean process?.pid

if isNodeJS
  path = require 'path'
  Jolt = require path.normalize process.cwd() + '/../index'

beforeEach ->
  Jolt.globalize()

describe 'Jolt.Behavior', ->
  ###
  beforeEach ->
    # While running finalized specs, it's not desirable to have Pulse_cat log
    # to stdio, so we detach defaultCatchE/FinallyE before each spec
    Jolt.HEAP_E.removeListener Jolt.defaultHeapE
    ( expect Jolt.HEAP_E.sendTo.length ).toBe 0
    Jolt.CATCH_E.removeListener Jolt.defaultCatchE
    ( expect Jolt.CATCH_E.sendTo.length ).toBe 0
    Jolt.FINALLY_E.removeListener Jolt.defaultFinallyE
    ( expect Jolt.FINALLY_E.sendTo.length ).toBe 0

  afterEach ->
    # We may want Pulse_cat to log to stdio sometime during the development of
    # the specs, so we reattach defaultCatchE/FinallyE after each spec; this
    # way we can easily toggle the output spec by spec
    Jolt.HEAP_E.attachListener Jolt.defaultHeapE
    ( expect Jolt.HEAP_E.sendTo.length ).toBe 1
    Jolt.CATCH_E.attachListener Jolt.defaultCatchE
    ( expect Jolt.CATCH_E.sendTo.length ).toBe 1
    Jolt.FINALLY_E.attachListener Jolt.defaultFinallyE
    ( expect Jolt.FINALLY_E.sendTo.length ).toBe 1
  ###

  it '''
    should
  ''', ->

    EventStream.prototype.PulseClass Pulse_cat

    myE = internalE()

    myB = ($B myE, 1, 2, 3).v()

    myB.changes()

    ( expect myB.valueNow() ).toEqual [1, 2, 3]

    sendEvent myE, 4, 5, 6

    ( expect myB.valueNow() ).toEqual [[4, 5, 6]]










###

  it '''

  ''', ->

###
