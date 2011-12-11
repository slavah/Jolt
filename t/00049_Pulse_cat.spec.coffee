isNodeJS = Boolean process?.pid

if isNodeJS
  path = require 'path'
  Jolt = require path.normalize process.cwd() + '/../index'

beforeEach ->
  Jolt.globalize()

describe 'Jolt.Pulse_cat', ->

  beforeEach ->
    # While running finalized specs, it's not desirable to have Pulse_cat log
    # to stdio, so we detach defaultCatchE/FinallyE before each spec
    Jolt.HEAP_E.removeListener Jolt.defaultHeapE
    Jolt.CATCH_E.removeListener Jolt.defaultCatchE
    Jolt.FINALLY_E.removeListener Jolt.defaultFinallyE

  afterEach ->
    # We may want Pulse_cat to log to stdio sometime during the development of
    # the specs, so we reattach defaultCatchE/FinallyE after each spec; this
    # way we can easily toggle the output spec by spec
    Jolt.HEAP_E.attachListener Jolt.defaultHeapE
    Jolt.CATCH_E.attachListener Jolt.defaultCatchE
    Jolt.FINALLY_E.attachListener Jolt.defaultFinallyE


  it '''
    should propagate a pulse through Jolt.FINALLY_E for each EventStream for
    which the 'PulseClass' setter method has been called with the Pulse_cat
    constructor; if Pulse_cat is set in this manner for the EventStream
    prototype, there should be a FINALLY_E propagation for all EventStreams
  ''', ->

    myE = []
    myE[1] = internalE()
    myE[2] = (internalE myE[1]).PulseClass Pulse_cat
    myE[3] = internalE myE[2]
    myE[4] = (internalE myE[3]).PulseClass Pulse_cat
    myE[5] = (internalE myE[1]).PulseClass Pulse_cat

    myFin = internalE Jolt.FINALLY_E

    checkIt = 0

    myFinU = myFin.UPDATER
    myFin.UPDATER = (pulse) ->
      checkIt += 1
      myFinU.call myFin, pulse

    sendEvent myE[1], {}, [], {}

    ( expect checkIt ).toBe 3

    checkIt = 0

    EventStream.prototype.PulseClass Pulse_cat

    sendEvent myE[1], 0, 0, 0

    ( expect checkIt ).toBe 5

    Jolt.FINALLY_E.removeListener myFin

    EventStream.prototype.PulseClass Pulse


  it '''
    should propagate a pulse through Jolt.CATCH_E if <EventStream>.UPDATER does
    not return a valid pulse object, as determined by Jolt.isP
  ''', ->

    myE = internalE().PulseClass Pulse_cat

    myE.UPDATER = (pulse) -> {} # not a pulse

    myCatcher = internalE Jolt.CATCH_E

    checkIt = []

    myCU = myCatcher.UPDATER
    myCatcher.UPDATER = (pulse) ->
      checkIt.push pulse.value[0]
      checkIt.push pulse.value[1].value...
      myCU.call myCatcher, pulse

    sendEvent myE, 'a', 'b', 'c'

    ( expect checkIt ).toEqual [
      'receiver\'s UPDATER did not return a pulse object'
      'a'
      'b'
      'c'
    ]

    Jolt.CATCH_E.removeListener myCatcher


  it '''
    should propagate a pulse through Jolt.CATCH_E for each EventStream for
    which the 'PulseClass' setter method has been called with the Pulse_cat
    constructor, in the case of an error thrown during the EventStream's
    'UPDATER'/'updater' cycle; if Pulse_cat is set in this manner for the
    EventStream prototype, there should be a CATCH_E propagation for all
    EventStreams
  ''', ->

    myE = []
    myE[1] = internalE().PulseClass Pulse_cat
    myE[i] = (internalE myE[1]).PulseClass Pulse_cat for i in [2..4]

    myCatcher = internalE Jolt.CATCH_E

    checkIt = []

    myCU = myCatcher.UPDATER
    myCatcher.UPDATER = (pulse) ->
      checkIt.push pulse.value[0]
      myCU.call myCatcher, pulse

    bomb = 'throw this'

    myE[2].UPDATER = -> throw bomb
    myE[3].updater = -> throw bomb
    myE[4].UPDATER = -> throw bomb

    sendEvent myE[1], 1, 2, 3

    ( expect checkIt ).toEqual [bomb, bomb, bomb]

    myE[5] = internalE()
    myE[i] = internalE myE[5] for i in [6..7]

    myE[6].UPDATER = -> throw bomb
    myE[7].updater = -> throw bomb

    checkIt = []

    EventStream.prototype.PulseClass Pulse_cat

    sendEvent myE[5], 'x', 'y'

    ( expect checkIt ).toEqual [bomb, bomb]

    Jolt.CATCH_E.removeListener myCatcher

    EventStream.prototype.PulseClass Pulse


  it '''
    should result in an uncaught exception if an error is thrown in the catch
    or finally branches
  ''', ->

    myFin = internalE(Jolt.FINALLY_E).PulseClass Pulse_cat

    myFin.UPDATER = ->
      throw 'an uncaught bomb'

    myE = []
    myE[1] = internalE().PulseClass Pulse_cat

    ( expect -> sendEvent myE[1], 1, 2, 3 ).toThrow 'an uncaught bomb'

    Jolt.FINALLY_E.removeListener myFin

    # myCatcher = internalE(Jolt.CATCH_E).PulseClass Pulse_cat
    myCatcher = internalE(Jolt.CATCH_E)

    myCatcher.UPDATER = ->
      throw 'another uncaught bomb'

    myE[2] = internalE().PulseClass Pulse_cat

    myE[2].UPDATER = ->
      throw 'this one is caught'

    ( expect -> sendEvent myE[2], 4, 5, 6 ).toThrow 'another uncaught bomb'

    Jolt.CATCH_E.removeListener myCatcher
