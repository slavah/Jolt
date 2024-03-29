isNodeJS = Boolean process?.pid

if isNodeJS
  path = require 'path'
  Jolt = require path.normalize process.cwd() + '/../index'

beforeEach ->
  Jolt.globalize()


describe 'Jolt.delay', ->

  it '''
    should delay a function call by at least the number of milliseconds
    specified
  ''', ->

    fin = []

    func = (val) ->
      fin.push val

    time1 = (new Date).valueOf()

    delay func, 150,           'a'
    delay (-> delay func, 50,  'b'), 150
    delay (-> delay func, 100, 'c'), 200

    waitsFor ->
      fin.length is 3

    runs ->
      time2 = (new Date).valueOf()
      ( expect time2 - time1 >= 300 ).toBe true


describe 'Jolt.defer', ->

  it '''
    should defer a function call across the event loop (shortcut for calling
    delay with `ms = 0`)
  ''', ->

    fin = false

    vals = []

    func = (val) ->
      vals.push val
      fin = true

    defer func, 'a'
    func        'b'
    fin = false

    waitsFor ->
      fin

    runs ->
      ( expect vals[0] ).toBe 'b'
      ( expect vals[1] ).toBe 'a'


describe 'Jolt.Pulse', ->

  it '''
    a new pulse's 'heap' property should have the same 'stamp' as the
    pulse itself
  ''', ->

    testP = new Jolt.Pulse 1, false, {}, 1, ['value']

    ( expect testP.heap.stamp ).toBe testP.stamp


  it '''
    if an instance of Jolt.ContInfo is passed as the last argument to the Pulse
    (or Pulse subclass) constructor, then it should be stored as the 'cont'
    property of the Pulse instance
  ''', ->

    testC = new Jolt.ContInfo [1], [ (estream = {}) ]

    # Note: it's important to pass undefined as the heap-argument if the desired
    # result is to have the Pulse constructor generate a new HeapStore instance
    # stored as the pulse's 'heap' property
    testP = new Jolt.Pulse 2, false, {}, 1, ['value'], undefined, testC

    ( expect testP.heap.cont ).toBe testC
    ( expect (testP.heap instanceof Jolt.HeapStore)).toBe true
    ( expect testP.heap.cont.nodes  ).toEqual [ estream ]
    ( expect testP.heap.cont.stamps ).toEqual [ 1 ]


describe 'Jolt.scheduleCleanup', ->

  it '''
    should push a "cleanup job" onto a 'cleanupQ', performing the expected
    cleanup op following a configurable delay set in the 'cleanupQ.freq'
    property and the invocation of the queue's 'drain' method
  ''', ->

    fin = false

    mockSender = removeWeakReference: (weakReference, now = false) ->
      'mock method'
      fin = true

    mockWeakReference = {}

    ( spyOn Jolt.cleanupQ, 'drain'            ).andCallThrough()
    ( spyOn mockSender, 'removeWeakReference' ).andCallThrough()

    scheduleCleanup Jolt.cleanupQ, mockSender, mockWeakReference

    ( expect Jolt.cleanupQ.length ).toBe 1

    waitsFor ->
      Jolt.cleanupQ.length is 0 and fin is true

    runs ->
      ( expect Jolt.cleanupQ.drain            ).toHaveBeenCalled()
      ( expect mockSender.removeWeakReference ).toHaveBeenCalledWith mockWeakReference, true


  it '''
    should not push a "cleanup job" onto a 'cleanupQ', if the specified
    'weakReference' has its 'cleanupScheduled' property set to 'true'
  ''', ->

    mockSender = {}
    mockWeakReference = cleanupScheduled: true

    mockQ = []

    scheduleCleanup mockQ, mockSender, mockWeakReference

    ( expect Jolt.cleanupQ.length ).toBe 0


describe 'Jolt.scheduleBefore', ->

  it '''
    should push a "before next pulse job" onto a 'beforeQ', performing the
    expected op/s following a configurable delay set in the 'beforeQ.freq'
    property and the invovation of the queue's 'drain' method
  ''', ->

    fin = false

    testObj = {}
    testObj.testFunc = (args...) -> fin = true
    testArgs = [ 'a', 'b', { c: [1] } ]

    ( spyOn Jolt.beforeQ, 'drainNorm' ).andCallThrough()
    ( spyOn testObj, 'testFunc'   ).andCallThrough()

    Jolt.scheduleBefore Jolt.beforeQ, testObj.testFunc, testArgs...

    ( expect beforeQ.norm.length ).toBe 1

    waitsFor ->
      Jolt.beforeQ.norm.length is 0 and fin is true

    runs ->
      ( expect Jolt.beforeQ.drainNorm ).toHaveBeenCalled()
      ( expect testObj.testFunc       ).toHaveBeenCalledWith testArgs...


describe 'Jolt.Pulse.prototype.propagate', ->

  lastRank = 0
  nextRank = -> ++lastRank

  lastStamp = 0
  nextStamp = -> ++lastStamp

  MockE = null

  beforeEach ->
    class MockE
      constructor: () ->
        @rank = nextRank()
        @sendTo = []

      cleanupScheduled: false

      _PulseClass: Pulse

      PulseClass: -> @_PulseClass

      updater: (pulse) -> pulse

      UPDATER: (pulse) -> @updater pulse

      weaklyHeld: false


  it '''
    should propagate a pulse through a mock EventStream's 'updater', by way of
    <EventStream>._PulseClass.prototype.PROPAGATE and <EventStream>.UPDATER
  ''', ->

    mockSender = {}

    pulse = new Pulse 1, false, mockSender, nextStamp(), ['a']

    me = new MockE

    ( spyOn me._PulseClass.prototype, 'PROPAGATE' ).andCallThrough()
    ( spyOn me, 'UPDATER'                         ).andCallThrough()
    ( spyOn me, 'updater'                         ).andCallThrough()

    pulse.propagate pulse.sender, me

    # the following three references to the 'PROPAGATE' method are equivalent,
    # though that would not be the case if instances of MockE had their
    # '_PulseClass' properties set to a subclass of Pulse which overrode
    # the method with another definition
    ( expect me._PulseClass.prototype.PROPAGATE ).toHaveBeenCalled()
    ( expect Pulse.prototype.PROPAGATE          ).toHaveBeenCalled()
    ( expect pulse.PROPAGATE                    ).toHaveBeenCalled()

    ( expect me.UPDATER                         ).toHaveBeenCalled()
    ( expect me.updater                         ).toHaveBeenCalled()


  it '''
    should throw an error if a mock EventStream's 'UPDATER' method does not
    return a valid pulse object, as determined by Jolt.isP
  ''', ->

    mockSender = {}

    pulse = new Pulse 1, false, mockSender, nextStamp(), ['a']

    me = new MockE
    me.UPDATER = -> {} # not a pulse object

    ( expect -> pulse.propagate pulse.sender, me ).toThrow \
    'receiver\'s UPDATER did not return a pulse object'


  it '''
    should not propagate a pulse through a mock EventStream's
    'UPDATER'/'updater' if <EventStream>.weaklyHeld property is true; should
    also result in the sender's 'removeWeakReference' method being called
  ''', ->

    fin = false

    mockSender = removeWeakReference: (weakReference) ->
      'mock method'
      fin = true

    pulse = new Pulse 2, false, mockSender, nextStamp(), ['b', 'c']

    me = new MockE
    me.weaklyHeld = true

    ( spyOn me._PulseClass.prototype, 'PROPAGATE' ).andCallThrough()
    ( spyOn me, 'UPDATER'                         ).andCallThrough()
    ( spyOn me, 'updater'                         ).andCallThrough()
    ( spyOn mockSender, 'removeWeakReference'     ).andCallThrough()

    pulse.propagate pulse.sender, me

    # equivalent references to the 'PROPAGATE' method; see note above
    ( expect me._PulseClass.prototype.PROPAGATE ).not.toHaveBeenCalled()
    ( expect Pulse.prototype.PROPAGATE          ).not.toHaveBeenCalled()
    ( expect pulse.PROPAGATE                    ).not.toHaveBeenCalled()

    ( expect me.UPDATER                ).not.toHaveBeenCalled()
    ( expect me.updater                ).not.toHaveBeenCalled()

    waitsFor ->
      fin

    runs ->
      ( expect mockSender.removeWeakReference ).toHaveBeenCalledWith me


  it '''
    should propagate a pulse through chained mock EventStreams, according to
    the expected 'rank' order and honoring the rules for 'weaklyHeld' and
    'doNotPropagate'; with resulting calls to
    'scheduleCleanup'/'removeWeakReference'
  ''', ->

    fin = []

    class Pulse_ext extends Pulse
      PROPAGATE: (args...) ->
        super

    class MockE_ext extends MockE
      _PulseClass: Pulse_ext

      removeWeakReference: (weakReference) ->
        'mock method'
        fin.push weakReference

    mockSender = removeWeakReference: (weakReference) ->
      'mock method'

    me = (new MockE_ext for i in [1..10])

    me[0].sendTo.push me[3], me[1]
    me[3].weaklyHeld = true
    me[1].sendTo.push me[4], me[2], me[5]
    me[2].sendTo.push me[6]
    me[2].UPDATER = -> doNotPropagate
    me[4].sendTo.push me[7]
    me[7].sendTo.push me[9], me[8]
    me[8].weaklyHeld = true
    me[9].weaklyHeld = true

    pulse = new me[0]._PulseClass 3, false, mockSender, nextStamp(), ['d', 'e', 'f']

    heap = pulse.propagate pulse.sender, me[0]

    waitsFor ->
      fin.length is 4

    runs ->
      ( expect heap.nodes ).toEqual [
        [ mockSender, me[0] ]
        [ me[0], me[1] ]
        [ me[1], me[2] ]
        [ me[1], me[4] ]
        [ me[1], me[5] ]
        [ me[4], me[7] ]
      ]

      ( expect fin ).toEqual [
        me[3]
        me[9]
        me[8]
        me[7]
      ]
