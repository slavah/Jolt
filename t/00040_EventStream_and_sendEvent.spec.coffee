isNodeJS = Boolean process?.pid

if isNodeJS
  path = require 'path'
  Jolt = require path.normalize process.cwd() + '/../index'

beforeEach ->
  Jolt.globalize()

describe '<EventStream>.rank', ->

  it '''
    two new EventStreams created one after the other should have 'rank'/
    'absRank' properties which differ by the value integer 1
  ''', ->

    myE = []
    myE[i] = new EventStream for i in [0..1]

    ( expect myE[i].rank ).toBe myE[i].absRank for i in [0..(myE.length - 1)]

    ( expect myE[1].rank    -   myE[0].rank    ).toBe 1
    ( expect myE[1].absRank -   myE[0].absRank ).toBe 1

describe 'Jolt.EventStream.prototype.mode', ->

  it '''
    should set an EventStream's '_mode' property and return the EventStream, if
    it's called with one of six valid string arguments; if the argument is not
    a (valid) string, it will not change the '_mode' property but will throw an
    error
  ''', ->

    validStr = [['sequenced', 's'], ['vectored', 'v'], ['zipped', 'z']]

    myE = new EventStream

    _( validStr ).map (set) ->
      finS = set[0]
      _( set ).map (str) ->
        ret = myE.mode str
        ( expect ret ).toBe myE
        ( expect myE._mode ).toBe finS

    myE.mode 'sequenced'

    bad = [
      'invalid'
      {}
      123
    ]

    ( expect -> myE.mode i ).toThrow '<EventStream>.mode: ' + JSON.stringify(i) + ' is not a valid mode' for i in bad

    ( expect myE._mode ).toBe 'sequenced'

    myE.mode null
    ( expect myE._mode ).toBe null

    myE.mode undefined
    ( expect myE._mode ).toBe null


  it '''
    should return the value of an EventStream's '_mode' property if it is
    called with no arguments
  ''', ->

    myE = new EventStream

    myE.mode 'vectored'
    ret = myE.mode()

    ( expect ret ).toBe 'vectored'


describe 'Jolt.EventStream.prototype.null', ->

  it '''
    should have the same effect as calling <EventStream>.mode(null),
    ignoring any arguments passed to it
  ''', ->

    myE = new EventStream

    ( expect (-> myE.null() is (myE.mode null) is myE)()             ).toBe true
    ( expect (-> myE.null(1,2,3) is (myE.mode null) is myE)() ).toBe true

    ( expect myE._mode ).toBe null


describe 'Jolt.EventStream.prototype.s', ->

  it '''
    should have the same effect as calling <EventStream>.mode('sequenced'),
    ignoring any arguments passed to it
  ''', ->

    myE = new EventStream

    ( expect (-> myE.s() is (myE.mode 'sequenced') is myE)()      ).toBe true
    ( expect (-> myE.s(1,2,3) is (myE.mode 'sequenced') is myE)() ).toBe true

    ( expect myE._mode ).toBe 'sequenced'


describe 'Jolt.EventStream.prototype.sequenced', ->

  it '''
    should have the same effect as calling <EventStream>.mode('sequenced'),
    ignoring any arguments passed to it
  ''', ->

    myE = new EventStream

    ( expect (-> myE.sequenced() is (myE.mode 'sequenced') is myE)()      ).toBe true
    ( expect (-> myE.sequenced(1,2,3) is (myE.mode 'sequenced') is myE)() ).toBe true

    ( expect myE._mode ).toBe 'sequenced'


describe 'Jolt.EventStream.prototype.v', ->

  it '''
    should have the same effect as calling <EventStream>.mode('vectored'),
    ignoring any arguments passed to it
  ''', ->

    myE = new EventStream

    ( expect (-> myE.v() is (myE.mode 'vectored') is myE)()      ).toBe true
    ( expect (-> myE.v(1,2,3) is (myE.mode 'vectored') is myE)() ).toBe true

    ( expect myE._mode ).toBe 'vectored'


describe 'Jolt.EventStream.prototype.vectored', ->

  it '''
    should have the same effect as calling <EventStream>.mode('vectored'),
    ignoring any arguments passed to it
  ''', ->

    myE = new EventStream

    ( expect (-> myE.vectored() is (myE.mode 'vectored') is myE)()      ).toBe true
    ( expect (-> myE.vectored(1,2,3) is (myE.mode 'vectored') is myE)() ).toBe true

    ( expect myE._mode ).toBe 'vectored'


describe 'Jolt.EventStream.prototype.z', ->

  it '''
    should have the same effect as calling <EventStream>.mode('zipped'),
    ignoring any arguments passed to it
  ''', ->

    myE = new EventStream

    ( expect (-> myE.z() is (myE.mode 'zipped') is myE)()      ).toBe true
    ( expect (-> myE.z(1,2,3) is (myE.mode 'zipped') is myE)() ).toBe true

    ( expect myE._mode ).toBe 'zipped'


describe 'Jolt.EventStream.prototype.zipped', ->

  it '''
    should have the same effect as calling <EventStream>.mode('zipped'),
    ignoring any arguments passed to it
  ''', ->

    myE = new EventStream

    ( expect (-> myE.zipped() is (myE.mode 'zipped') is myE)()      ).toBe true
    ( expect (-> myE.zipped(1,2,3) is (myE.mode 'zipped') is myE)() ).toBe true

    ( expect myE._mode ).toBe 'zipped'


describe 'Jolt.EventStream.prototype.name', ->

  it '''
    should set an EventStream's '_name' property and return the EventStream, if
    it's called with a string argument; if the argument is not a string, it
    will not change the '_name' property but will throw an error
  ''', ->

    myE = new EventStream

    ret = myE.name('a string')
    ( expect myE._name ).toBe 'a string'
    ( expect ret       ).toBe myE

    bad = [
      123
      null
      {}
      undefined
    ]

    ( expect -> myE.name i ).toThrow '<EventStream>.name: argument must be a string' for i in bad
    ( expect myE._name     ).toBe 'a string'


  it '''
    should return the value of an EventStream's '_name' property if it is
    called with no arguments
  ''', ->

    myE = new EventStream

    myE.name 'some name'
    ret = myE.name()

    ( expect ret ).toBe 'some name'


describe 'Jolt.EventStream.prototype.isNary', ->

  it '''
    should set the value of an EventStream's '_nary' property to true if it is
    called it is called with a truthy value, and to false if it is called with
    a falsy value
  ''', ->

    myE = new EventStream

    myE.isNary true
    ( expect myE._nary ).toBe true
    myE.isNary 1
    ( expect myE._nary ).toBe true
    myE.isNary 'a string'
    ( expect myE._nary ).toBe true
    myE.isNary {}
    ( expect myE._nary ).toBe true

    myE.isNary false
    ( expect myE._nary ).toBe false
    myE.isNary 0
    ( expect myE._nary ).toBe false
    myE.isNary ''
    ( expect myE._nary ).toBe false

  it '''
    should return the value of an EventStream's '_nary' property if it is
    called with no arguments
  ''', ->

    myE = new EventStream

    ret = myE.isNary()

    ( expect ret ).toBe false
    ( expect ret ).not.toBe true

    myE._nary = true
    ret = myE.isNary()

    ( expect ret ).toBe true
    ( expect ret ).not.toBe false


describe 'Jolt.EventStream.prototype.nary', ->

  it '''
    should have the same effect as calling <EventStream>.isNary(true),
    ignoring any arguments passed to it
  ''', ->

    myE = new EventStream

    myE.isNary false

    ( expect myE._nary ).toBe false

    myE.nary()

    ( expect myE._nary ).toBe true

    myE.isNary false

    ( expect myE._nary ).toBe false

    myE.nary 123
    myE.nary 0
    myE.nary false

    ( expect myE._nary ).toBe true


describe 'Jolt.EventStream.prototype.PulseClass', ->

  it '''
    should set an EventStream's '_PulseClass' property and return the
    EventStream if it is called with a function that returns an instanceof
    Pulse; if the argument-function does not return an instanceof Pulse, or if
    the argument is not a function, the method will not change the
    '_PulseClass' property but will throw an error
  ''', ->

    myE = new EventStream
    class myPulse extends Pulse

    ret = myE.PulseClass myPulse

    ( expect ret             ).toBe myE
    ( expect myE._PulseClass ).toBe myPulse

    e = []
    e[0] = '<EventStream>.PulseClass: argument does not construct an instanceof Pulse'
    e[1] = '<EventStream>.PulseClass: argument must be a function'

    bad = [
      [(->), e[0]]
      [1 , e[1]]
      [undefined, e[1]]
    ]

    ( expect -> myE.PulseClass i[0] ).toThrow i[1] for i in bad
    ( expect myE._PulseClass        ).toBe myPulse


  it '''
    should return the value of an EventStream's '_PulseClass' property if it is
    called with no arguments
  ''', ->

    myE = new EventStream
    class myPulse extends Pulse

    myE.PulseClass myPulse
    ret = myE.PulseClass()

    ( expect ret ).toBe myPulse


describe 'Jolt.EventStream.prototype.attachListener', ->

  it '''
    should throw an error if the 'receiver' argument is not an EventStream, as
    determined by Jolt.isE
  ''', ->

    myE = new EventStream

    bad = [
      null
      1234
      {}
    ]

    ( expect -> myE.attachListener i ).toThrow '<EventStream>.attachListener: expected an EventStream' for i in bad


  it '''
    should push an EventStream into the method's EventStream's 'sendTo'
    array-property
  ''', ->

    myE = []
    myE[i] = new EventStream for i in [0..1]

    myE[0].attachListener myE[1]

    ( expect myE[0].sendTo[0] ).toBe myE[1]


  it '''
    should throw an error if an EventStream is attached as a listener to itself
  ''', ->

    myE  = new EventStream

    tryIt = ->
      myE.attachListener myE

    ( expect tryIt ).toThrow '<EventStream>.attachListener: cycle detected in propagation graph'


  it '''
    should throw an error if a cycle is introduced into a propagation graph
  ''', ->

    myE = []
    myE[i] = new EventStream for i in [0..4]

    tryIt = ->
      myE[1].attachListener myE[2]
      myE[1].attachListener myE[3]
      myE[3].attachListener myE[4]
      myE[4].attachListener myE[0]

      myE[0].attachListener myE[1]

    ( expect tryIt ).toThrow '<EventStream>.attachListener: cycle detected in propagation graph'


  it '''
    should not attach a listener if it's already attached
  ''', ->

    myE = []
    myE[i] = new EventStream for i in [0..1]

    myE[0].attachListener myE[1]
    myE[0].attachListener myE[1]

    ( expect myE[0].sendTo.length ).toBe 1


  it '''
    for each EventStream passed as an argument (array-arguments are flattened)
    to the EventStream constructor, the EventStream-arguments's
    'attachListener' method should be called with the new EventStream as its
    argument
  ''', ->

    myE = []
    myE[i] = new EventStream for i in [0..4]

    myE_a = new EventStream myE[0], myE[1], myE[2], myE[3], myE[4]

    myE_b = new EventStream [myE[0]], [myE[1], [myE[2], myE[3]]], [myE[4]]

    myE_c = new EventStream myE[0], [myE[1], myE[2], myE[3]], myE[4]

    Es = [myE_a, myE_b, myE_c]

    ( expect (i.sendTo for i in myE) ).toEqual [Es, Es, Es, Es, Es]


  it '''
    when the EventStream-argument to an EventStream's 'attachListener' method
    has a 'rank' property which is numerically less than the latter's 'rank',
    then the EventStream-argument's 'rank' should be incremented according to
    Jolt's internal 'nextRank' function, and too the 'rank' property of all the
    EventStreams indicated in the EventStream-argument's 'sendTo' property, and
    so on recursively; if the "rank update" process detects a cyle in the
    propagation graph, and thus throws an error, then the 'sendTo'
    array-property of the EventStream on which 'attachListener' was called
    should remain effectively unmodified and the 'rank' properties of dependent
    EventStreams will not be incremented
  ''', ->

    myE = []
    myE[i] = new EventStream for i in [0..4]

    ranks = (i.rank for i in myE)

    myE[0].attachListener myE[1]
    myE[0].attachListener myE[2]
    myE[2].attachListener myE[3]

    myE[4].attachListener myE[0]

    ( expect (i.rank for i in myE) ).toEqual (ranks[4] + j for j in ([1..4].concat 0))

    ( expect myE[3].sendTo ).toEqual []

    ranks[2] = myE[2].rank

    try
      tryIt = -> myE[3].attachListener myE[2]
      ( expect tryIt ).toThrow '<EventStream>.attachListener: cycle detected in propagation graph'
      tryIt()
    catch error
      ( expect myE[3].sendTo ).toEqual []
      ( expect myE[2].rank   ).toBe ranks[2]


describe 'Jolt.EventStream.prototype.removeListener', ->

  it '''
    should throw an error if the 'receiver' argument is not an EventStream, as
    determined by Jolt.isE
  ''', ->

    myE = new EventStream

    bad = [
      null
      1234
      {}
    ]

    ( expect -> myE.removeListener i ).toThrow '<EventStream>.removeListener: expected an EventStream' for i in bad


  it '''
    should remove an argument-EventStream from the method's EventStream's
    'sendTo' array-property if the argument-EventStream is found in the array;
    otherwise, it should not modify the 'sendTo' array
  ''', ->

    myE = []
    myE[i] = new EventStream for i in [0..2]

    myE[0].attachListener myE[1]

    ( expect myE[0].sendTo ).toEqual [myE[1]]

    myE[0].removeListener myE[2]

    ( expect myE[0].sendTo ).toEqual [myE[1]]

    myE[0].removeListener myE[1]

    ( expect myE[0].sendTo ).toEqual []


describe 'Jolt.EventStream.prototype.removeWeakReference', ->

  it '''
    should throw an error if the 'receiver' argument is not an EventStream, as
    determined by Jolt.isE
  ''', ->

    myE = new EventStream

    bad = [
      null
      1234
      {}
    ]

    ( expect -> myE.removeWeakReference i ).toThrow '<EventStream>.removeWeakReference: expected an EventStream' for i in bad


  it '''
    should change an argument-EventStream's 'cleanupScheduled' property to
    false
  ''', ->

    myE = []
    myE[i] = new EventStream for i in [0..1]

    myE[1].cleanupScheduled = true

    myE[0].attachListener myE[1]

    myE[0].removeWeakReference myE[1]

    ( expect myE[1].cleanupScheduled ).toBe false


  it '''
    should remove an argument-EventStream from the method's EventStream's
    'sendTo' array-property if the argument-EventStream is found in the array;
    otherwise, it should not modify the 'sendTo' array
  ''', ->

    myE = []
    myE[i] = new EventStream for i in [0..2]

    myE[0].attachListener myE[1]

    ( expect myE[0].sendTo ).toEqual [myE[1]]

    myE[0].removeWeakReference myE[2]

    ( expect myE[0].sendTo ).toEqual [myE[1]]

    myE[0].removeWeakReference myE[1]

    ( expect myE[0].sendTo ).toEqual []


  it '''
    should not remove an argument-EventStream from the method's EventStream's
    'sendTo' array-property if the argument-EventStream's 'cleanupCanceled'
    property is true; the EventStream-argument should subsequently have it's
    'cleanupCanceled' property set to null
  ''', ->

    myE = []
    myE[i] = new EventStream for i in [0..1]

    myE[1].cleanupCanceled = true

    myE[0].attachListener myE[1]

    myE[0].removeWeakReference myE[1]

    ( expect myE[0].sendTo[0]       ).toBe myE[1]
    ( expect myE[1].cleanupCanceled ).toBe null


  it '''
    should set the method's EventStream's 'weaklyHeld' property to true when
    the remove op results in the EventStream's 'sendTo' array property being
    reduced to length 0; otherwise the 'weaklyHeld' property should remain
    false
  ''', ->

    myE = []
    myE[i] = new EventStream for i in [0..2]

    ( expect myE[0].weaklyHeld ).toBe false

    myE[0].attachListener myE[1]

    myE[0].removeWeakReference myE[1]

    ( expect myE[0].weaklyHeld ).toBe true

    myE[0].weaklyHeld = false

    myE[0].attachListener myE[1]
    myE[0].attachListener myE[2]

    myE[0].removeWeakReference myE[1]

    ( expect myE[0].weaklyHeld ).toBe false

    myE[0].removeWeakReference myE[2]

    ( expect myE[0].weaklyHeld ).toBe true


describe 'EventStream.prototype.UPDATER', ->

  it '''
    should throw an error if an EventStream's '_mode' property is set to an
    unsupported value
  ''', ->

    myE = new EventStream
    myE._mode = 'bad string'

    pulse = new (myE.PulseClass()) 4, false, Jolt.sendCall, 1, ['a','b','c','d']

    ( expect -> myE.UPDATER pulse ).toThrow '<' + myE.ClassName + '>.transRCV: bad mode value ' + (JSON.stringify myE.mode())


  it '''
    for an EventStream in null mode, it should throw an error if the
    EventStream's 'no_null_junc' property is true and the argument-pulse's
    'junction' property is true
  ''', ->

    class EventStream_ext extends EventStream
      no_null_junc: true

    myE = new EventStream_ext

    pulse = []
    pulse[0] = new (myE.PulseClass()) 4, false, Jolt.sendCall, 1, ['a','b','c','d']
    pulse[1] = new (myE.PulseClass()) 1, true,  Jolt.sendCall, 1, [pulse[0]]

    ( expect -> myE.UPDATER pulse[1] ).toThrow '<' + myE.ClassName + '>.transRCV: does not support null mode for pulse junctions'


  it '''
    for an EventStream in null mode, it should return pulses and junction
    pulses unmodified
  ''', ->

    myE = new EventStream

    pulse = []
    pulse[0] = new (myE.PulseClass()) 4, false, Jolt.sendCall, 1, ['a','b','c','d']

    retP = []
    retP[0] = myE.UPDATER pulse[0]

    checkProps = ['arity', 'junction', 'sender', 'stamp', 'value']

    ( expect (retP[0][i] for i in checkProps) ).toEqual [
      4
      false
      Jolt.sendCall
      1
      ['a','b','c','d']
    ]

    pulse[1] = new (myE.PulseClass()) 1, false, Jolt.sendCall, 2, [null]
    pulse[2] = new (myE.PulseClass()) 2, false, Jolt.sendCall, 3, ['a','b']
    pulse[3] = new (myE.PulseClass()) 3, false, Jolt.sendCall, 4, [1,2,3]
    pulse[4] = new (myE.PulseClass()) 4, false, Jolt.sendCall, 5, [{},{},{},{}]

    pulse[5] = new (myE.PulseClass()) 4, true, Jolt.sendCall, 6, [pulse[1],pulse[2],pulse[3],pulse[4]]

    retP[1] = myE.UPDATER pulse[5]

    ( expect (retP[1][i] for i in checkProps) ).toEqual [
      4
      true
      Jolt.sendCall
      6
      [pulse[1],pulse[2],pulse[3],pulse[4]]
    ]

    pulse[6] = new (myE.PulseClass()) 1, false, Jolt.sendCall, 7, [[]]
    pulse[7] = new (myE.PulseClass()) 2, true,  Jolt.sendCall, 8, [pulse[5],pulse[6]]

    retP[2] = myE.UPDATER pulse[7]

    ( expect (retP[2][i] for i in checkProps) ).toEqual [
      2
      true
      Jolt.sendCall
      8
      [pulse[5],pulse[6]]
    ]


  it '''
    for an EventStream in 'sequenced' mode, it should return pulses and
    junction pulses unmodified and with concatenated values, respectively
  ''', ->

    myE = new EventStream
    myE.s()

    pulse = []
    pulse[0] = new (myE.PulseClass()) 4, false, Jolt.sendCall, 1, ['a','b','c','d']

    retP = []
    retP[0] = myE.UPDATER pulse[0]

    checkProps = ['arity', 'junction', 'sender', 'stamp', 'value']

    ( expect (retP[0][i] for i in checkProps) ).toEqual [
      4
      false
      Jolt.sendCall
      1
      ['a','b','c','d']
    ]

    pulse[1] = new (myE.PulseClass()) 1, false, Jolt.sendCall, 2, [null]
    pulse[2] = new (myE.PulseClass()) 2, false, Jolt.sendCall, 3, ['a','b']
    pulse[3] = new (myE.PulseClass()) 3, false, Jolt.sendCall, 4, [1,2,3]
    pulse[4] = new (myE.PulseClass()) 4, false, Jolt.sendCall, 5, [{},{},{},{}]

    pulse[5] = new (myE.PulseClass()) 4, true, Jolt.sendCall, 6, [pulse[1],pulse[2],pulse[3],pulse[4]]

    retP[1] = myE.UPDATER pulse[5]

    ( expect (retP[1][i] for i in checkProps) ).toEqual [
      10
      false
      Jolt.sendCall
      6
      [pulse[1].value...,pulse[2].value...,pulse[3].value...,pulse[4].value...]
    ]

    pulse[6] = new (myE.PulseClass()) 1, false, Jolt.sendCall, 7, [[]]
    pulse[7] = new (myE.PulseClass()) 2, true,  Jolt.sendCall, 8, [pulse[5],pulse[6]]

    retP[2] = myE.UPDATER pulse[7]

    ( expect (retP[2][i] for i in checkProps) ).toEqual [
      11
      false
      Jolt.sendCall
      8
      [retP[1].value...,pulse[6].value...]
    ]


  it '''
    for an EventStream in 'vectored' mode, it should return pulses and
    junction pulses with one or more "array-boxed" sets of values, respectively
  ''', ->

    myE = new EventStream
    myE.v()

    pulse = []
    pulse[0] = new (myE.PulseClass()) 4, false, Jolt.sendCall, 1, ['a','b','c','d']

    retP = []
    retP[0] = myE.UPDATER pulse[0]

    checkProps = ['arity', 'junction', 'sender', 'stamp', 'value']

    ( expect (retP[0][i] for i in checkProps) ).toEqual [
      1
      false
      Jolt.sendCall
      1
      [['a','b','c','d']]
    ]

    pulse[1] = new (myE.PulseClass()) 1, false, Jolt.sendCall, 2, [null]
    pulse[2] = new (myE.PulseClass()) 2, false, Jolt.sendCall, 3, ['a','b']
    pulse[3] = new (myE.PulseClass()) 3, false, Jolt.sendCall, 4, [1,2,3]
    pulse[4] = new (myE.PulseClass()) 4, false, Jolt.sendCall, 5, [{},{},{},{}]

    pulse[5] = new (myE.PulseClass()) 4, true, Jolt.sendCall, 6, [pulse[1],pulse[2],pulse[3],pulse[4]]

    retP[1] = myE.UPDATER pulse[5]

    ( expect (retP[1][i] for i in checkProps) ).toEqual [
      4
      false
      Jolt.sendCall
      6
      [pulse[1].value,pulse[2].value,pulse[3].value,pulse[4].value]
    ]

    pulse[6] = new (myE.PulseClass()) 4, true,  Jolt.sendCall, 7, [pulse[1],pulse[2],pulse[3],pulse[4]]
    pulse[7] = new (myE.PulseClass()) 1, false, Jolt.sendCall, 8, [undefined]
    pulse[8] = new (myE.PulseClass()) 2, true,  Jolt.sendCall, 9, [pulse[6],pulse[7]]

    retP[2] = myE.UPDATER pulse[8]

    ( expect (retP[2][i] for i in checkProps) ).toEqual [
      5
      false
      Jolt.sendCall
      9
      [retP[1].value...,pulse[7].value]
    ]


  it '''
    for an EventStream in 'zipped' mode, it should return pulses and
    junction pulses with one or more zipped and "array-boxed" sets of values,
    respectively
  ''', ->

    myE = new EventStream
    myE.z()

    pulse = []
    pulse[0] = new (myE.PulseClass()) 4, false, Jolt.sendCall, 1, ['a','b','c','d']

    retP = []
    retP[0] = myE.UPDATER pulse[0]

    checkProps = ['arity', 'junction', 'sender', 'stamp', 'value']

    ( expect (retP[0][i] for i in checkProps) ).toEqual [
      4
      false
      Jolt.sendCall
      1
      [['a'],['b'],['c'],['d']]
    ]

    pulse[1] = new (myE.PulseClass()) 1, false, Jolt.sendCall, 2, [null]
    pulse[2] = new (myE.PulseClass()) 2, false, Jolt.sendCall, 3, ['a','b']
    pulse[3] = new (myE.PulseClass()) 3, false, Jolt.sendCall, 4, [1,2,3]
    pulse[4] = new (myE.PulseClass()) 4, false, Jolt.sendCall, 5, [{},{},{},{}]

    pulse[5] = new (myE.PulseClass()) 4, true, Jolt.sendCall, 6, [pulse[1],pulse[2],pulse[3],pulse[4]]

    retP[1] = myE.UPDATER pulse[5]

    ( expect (retP[1][i] for i in checkProps) ).toEqual [
      4
      false
      Jolt.sendCall
      6
      [
        [null,'a',1,{}]
        [undefined,'b',2,{}]
        [undefined,undefined,3,{}]
        [undefined,undefined,undefined,{}]
      ]
    ]

    pulse[6] = new (myE.PulseClass()) 4, true,  Jolt.sendCall, 7, [pulse[1],pulse[2],pulse[3],pulse[4]]
    pulse[7] = new (myE.PulseClass()) 1, false, Jolt.sendCall, 8, ['x','y','z']
    pulse[8] = new (myE.PulseClass()) 2, true,  Jolt.sendCall, 9, [pulse[6],pulse[7]]

    retP[2] = myE.UPDATER pulse[8]

    ( expect (retP[2][i] for i in checkProps) ).toEqual [
      4
      false
      Jolt.sendCall
      9
      [
        [retP[1].value[0]...,'x']
        [retP[1].value[1]...,'y']
        [retP[1].value[2]...,'z']
        [retP[1].value[3]...,undefined]
      ]
    ]


  it '''
    for an EventStream that has its '_nary' property set to true, it should
    return pulses which have all members of their 'value' array-properties
    "unboxed" from any containing arrays, but only one level deep
  ''', ->

    checkP =
      RECV: null
      SEND: null

    class EventStream_ext extends EventStream
      UPDATER: (pulse) ->
        checkP.RECV = pulse.value
        super
        checkP.SEND = pulse.value
        pulse

    myE = new EventStream_ext

    myE.z()

    pulse = []
    pulse[0] = new (myE.PulseClass()) 3, false, Jolt.sendCall, 1, [1,2,3]

    myE.UPDATER pulse[0]

    ( expect checkP.RECV ).toEqual [1,2,3]
    ( expect checkP.SEND ).toEqual [[1],[2],[3]]

    myE.z().nary()

    pulse[1] = new (myE.PulseClass()) 3, false, Jolt.sendCall, 2, [1,2,3]

    myE.UPDATER pulse[1]

    ( expect checkP.RECV ).toEqual [1,2,3]
    ( expect checkP.SEND ).toEqual [1,2,3]

    myE.isNary(false)
    myE.v()

    fn = (vals...) ->
      ret = (x * 2 for x in vals)

    myE.updater = (value...) ->
      [ fn(value...) ]

    pulse[2] = new (myE.PulseClass()) 3, false, Jolt.sendCall, 3, [1,2,3]
    pulse[3] = new (myE.PulseClass()) 3, false, Jolt.sendCall, 4, [4,5,6]
    pulse[4] = new (myE.PulseClass()) 2, true,  Jolt.sendCall, 5, [pulse[2],pulse[3]]

    myE.UPDATER pulse[4]

    ( expect checkP.RECV ).toEqual [pulse[2],pulse[3]]
    ( expect checkP.SEND ).toEqual [[[2,4,6]],[[8,10,12]]]

    myE.isNary(false)
    myE.nary().v()

    pulse[5] = new (myE.PulseClass()) 3, false, Jolt.sendCall, 6, [1,2,3]
    pulse[6] = new (myE.PulseClass()) 3, false, Jolt.sendCall, 7, [4,5,6]
    pulse[7] = new (myE.PulseClass()) 2, true,  Jolt.sendCall, 8, [pulse[5],pulse[6]]

    myE.UPDATER pulse[7]

    ( expect checkP.RECV ).toEqual [pulse[5],pulse[6]]
    ( expect checkP.SEND ).toEqual [[2,4,6],[8,10,12]]

    myE.isNary(false)
    myE.z().nary()

    fn = (vals...) ->
      ret = ([x * 3] for x in vals)

    pulse[8]  = new (myE.PulseClass()) 3, false, Jolt.sendCall,  9, [1,2,3]
    pulse[9]  = new (myE.PulseClass()) 3, false, Jolt.sendCall, 10, [4,5,6]
    pulse[10] = new (myE.PulseClass()) 2, true,  Jolt.sendCall, 11, [pulse[8],pulse[9]]

    myE.UPDATER pulse[10]

    ( expect checkP.RECV ).toEqual [pulse[8],pulse[9]]
    ( expect checkP.SEND ).toEqual [[[3],[12]],[[6],[15]],[[9],[18]]]


describe 'Jolt.sendEvent', ->

  it '''
    should propagate the 2nd to Nth arguments through the EventStream's (1st
    argument's) 'UPDATER' and 'updater' methods
  ''', ->

    myE = new EventStream

    ( spyOn myE, 'UPDATER' ).andCallThrough()
    ( spyOn myE, 'updater' ).andCallThrough()

    sendEvent myE, 1, 2, 3

    ( expect myE.UPDATER ).toHaveBeenCalled()
    ( expect myE.updater ).toHaveBeenCalled()

    UP_vals = null
    up_vals = null

    myEU = myE.UPDATER
    myE.UPDATER = (pulse) ->
      UP_vals = pulse.value
      myEU.call myE, pulse

    myE.updater = (vals...) ->
      up_vals = vals
      vals

    sendEvent myE, 1, 2, 3

    ( expect UP_vals ).toEqual [1, 2, 3]
    ( expect up_vals ).toEqual [1, 2, 3]


  it '''
    when called two times in a row during the same trip around the event loop,
    the pulses it propagates should have 'stamp' properties which differ by the
    value integer 1
  ''', ->

    checkIt = []

    class EventStream_ext extends EventStream
      UPDATER: (pulse) ->
        checkIt.push pulse.stamp
        super

    myE = new EventStream_ext

    sendEvent myE, '1st'
    sendEvent myE, '2nd'

    ( expect checkIt[1] ).toBe checkIt[0] + 1


  it '''
    when received by the first EventStream in the propagation chain, the pulse
    propagated by Jolt.sendEvent should have its 'sender' property set to the
    Jolt.sendCall object; for a dependent EventStream, the pulse's 'sender'
    property should be set to the EventStream which propagates the pulse to it
  ''', ->

    checkIt = []

    class EventStream_ext extends EventStream
      UPDATER: (pulse) ->
        checkIt.push pulse.sender.name()
        super

    myE = []
    myE[i] = (new EventStream_ext).name 'myE_' + i for i in [0..3]

    myE[0].attachListener myE[1]
    myE[0].attachListener myE[2]
    myE[2].attachListener myE[3]

    sendEvent myE[0]

    ( expect checkIt ).toEqual ['Jolt.sendEvent','myE_0','myE_0','myE_2']


  it '''
    should call <EventStream>._PulseClass.prototype.propagate/PROPAGATE with
    the 'high' argument set to true if it's called with Jolt.propagateHigh as
    the last argument
  ''', ->

    checkIt = []

    class Pulse_ext extends Pulse
      PROPAGATE: (pulse, sender, receiver, high, isCatch, isFinally) ->
        checkIt.push high
        receiver.UPDATER pulse

    myE = new EventStream
    myE.PulseClass Pulse_ext

    sendEvent myE, {}, [], (->), propagateHigh

    ( expect checkIt ).toEqual [true]

    checkIt.pop()

    sendEvent myE, 'a', 'b', 'c'

    ( expect checkIt ).toEqual [false]


  it '''
    should result in Jolt.beforeQ being drained (and tasks exec'd) completely,
    unless it's called with Jolt.propagateHigh as the last argument
  ''', ->

    ( expect Jolt.beforeQ.length ).toBe 0

    checkIt = []

    aTask = (v) -> checkIt.push v

    taskArgs = ['x', 'y', 'z']

    Jolt.beforeQ.push -> aTask i for i in taskArgs

    myE = new EventStream

    sendEvent myE

    ( expect Jolt.beforeQ.length ).toBe 0
    ( expect checkIt ).toEqual ['x', 'y', 'z']

    checkIt = []

    Jolt.beforeQ.push -> aTask 'aaa'

    sendEvent myE, propagateHigh

    ( expect Jolt.beforeQ.length ).toBe 1
    ( expect checkIt ).toEqual []


  it '''
    should propagate a pulse through chained EventStreams, preserving the
    'arity', 'junction', and 'stamp' properties across 'updater'/'UPDATER'
    steps, and according to the expected 'rank' order, and honoring the rules
    for 'weaklyHeld' and 'doNotPropagate'; with resulting calls to
    'scheduleCleanup'/'removeWeakReference'
  ''', ->

    fin = []
    heap_save = nodes: []

    counter = -1
    hold_junction = null
    hold_stamp = null

    checkProps = ['arity', 'junction', 'stamp', 'value']

    class Pulse_ext extends Pulse
      PROPAGATE: (pulse, args...) ->
        heap_save = pulse.heap
        super

    class EventStream_ext extends EventStream
      _PulseClass: Pulse_ext

      UPDATER: (pulse) ->

        super

        if counter is -1 then hold_stamp = pulse.stamp

        counter += 1

        ( expect @name() ).toBe expectations[counter].name

        ( expect (pulse[i] for i in checkProps) ).toEqual [
          expectations[counter].arity
          expectations[counter].junction
          hold_stamp
          expectations[counter].value
        ]

        pulse

      removeWeakReference: (weakReference) ->
        fin.push weakReference
        super

    myE = []
    myE[i] = (new EventStream_ext).name 'myE_' + i for i in [0..9]

    myE[0].attachListener myE[3]
    myE[0].attachListener myE[1]

    myE[3].weaklyHeld = true

    myE[1].s()
    myE[1].attachListener myE[4]
    myE[1].attachListener myE[2]
    myE[1].attachListener myE[5]

    myE[2].attachListener myE[6]
    myE[2].UPDATER = -> doNotPropagate

    myE[4].z()
    myE[4].attachListener myE[7]

    myE[5].v()

    myE[7].v()
    myE[7].attachListener myE[9]
    myE[7].attachListener myE[8]

    myE[8].weaklyHeld = true

    myE[9].weaklyHeld = true

    testVals = ['a', 'b', 'c', 'd', 'e', 'f']

    expectations = [

      {
        arity: 6
        junction: false
        name: 'myE_0'
        value: [
          'a'
          'b'
          'c'
          'd'
          'e'
          'f'
        ]
      }

      {
        arity: 6
        junction: false
        name: 'myE_1'
        value: [
          'a'
          'b'
          'c'
          'd'
          'e'
          'f'
        ]
      }

      {
        arity: 6
        junction: false
        name: 'myE_4'
        value: [
          ['a']
          ['b']
          ['c']
          ['d']
          ['e']
          ['f']
        ]
      }

      {
        arity: 1
        junction: false
        name: 'myE_5'
        value: [
          [
            'a'
            'b'
            'c'
            'd'
            'e'
            'f'
          ]
        ]
      }

      {
        arity: 1
        junction: false
        name: 'myE_7'
        value: [
          [
            ['a']
            ['b']
            ['c']
            ['d']
            ['e']
            ['f']
          ]
        ]
      }

    ]

    sendEvent myE[0], testVals...

    ( expect Jolt.cleanupQ.length    ).toBe 4

    ( expect myE[0].sendTo           ).toEqual  [myE[3], myE[1]]
    ( expect myE[3].cleanupScheduled ).toBe true

    ( expect myE[7].sendTo           ).toEqual  [myE[9], myE[8]]
    ( expect myE[7].cleanupScheduled ).toBe true

    ( expect myE[8].cleanupScheduled ).toBe true
    ( expect myE[9].cleanupScheduled ).toBe true

    waitsFor ->
      fin.length is 4 and heap_save.nodes.length is 6

    runs ->
      ( expect heap_save.nodes ).toEqual [
        myE[0]
        myE[1]
        myE[2]
        myE[4]
        myE[5]
        myE[7]
      ]

      ( expect fin ).toEqual [
        myE[3]
        myE[9]
        myE[8]
        myE[7]
      ]

      waitsFor ->
        Jolt.cleanupQ.length is 0

      runs ->
        ( expect myE[0].sendTo ).toEqual [myE[1]]
        ( expect myE[7].sendTo ).toEqual []
        ( expect myE[4].sendTo ).toEqual []

        ( expect myE[4].weaklyHeld ).toBe true

        counter = -1

        myE[5].z()

        expectations = [

          {
            arity: 6
            junction: false
            name: 'myE_0'
            value: [
              'a'
              'b'
              'c'
              'd'
              'e'
              'f'
            ]
          }

          {
            arity: 6
            junction: false
            name: 'myE_1'
            value: [
              'a'
              'b'
              'c'
              'd'
              'e'
              'f'
            ]
          }

          {
            arity: 6
            junction: false
            name: 'myE_5'
            value: [
              ['a']
              ['b']
              ['c']
              ['d']
              ['e']
              ['f']
            ]
          }

        ]

        sendEvent myE[0], testVals...

        ( expect Jolt.cleanupQ.length    ).toBe 1
        ( expect myE[4].cleanupScheduled ).toBe true
        ( expect myE[1].sendTo           ).toEqual [myE[4], myE[2], myE[5]]

        waitsFor ->
          Jolt.cleanupQ.length is 0

        runs ->
          ( expect myE[1].sendTo ).toEqual [myE[2], myE[5]]


  it '''
    should result in tasks being pushed onto Jolt.beforeQ if during propagation
    an EventStream's 'attachListener', 'removeListener', or
    'removeWeakReference' method is called
  ''', ->

    myE_dummy = []
    myE_dummy[i] = (new EventStream).name 'dummy_' + i for i in [0..2]

    class EventStream_ext extends EventStream
      UPDATER: (pulse) ->
        @attachListener myE_dummy[0]
        @removeListener myE_dummy[1]
        @removeWeakReference myE_dummy[2]
        super

    myE = []
    myE[i] = (new EventStream_ext).name 'myE_' + i for i in [0..2]

    i = 0
    for j in myE
      j.attachListener myE_dummy[1]
      j.attachListener myE_dummy[2]
      if i < 2 then j.attachListener myE[i + 1]
      i++

    ( expect myE[0].sendTo ).toEqual [myE_dummy[1], myE_dummy[2], myE[1]]
    ( expect myE[1].sendTo ).toEqual [myE_dummy[1], myE_dummy[2], myE[2]]
    ( expect myE[2].sendTo ).toEqual [myE_dummy[1], myE_dummy[2]]

    sendEvent myE[0]

    ( expect Jolt.beforeQ.length  ).toBe 6
    ( expect Jolt.cleanupQ.length ).toBe 3

    waitsFor ->
      Jolt.beforeQ.length is 0 and Jolt.cleanupQ.length is 0

    runs ->
      ( expect myE[0].sendTo ).toEqual [myE[1], myE_dummy[0]]
      ( expect myE[1].sendTo ).toEqual [myE[2], myE_dummy[0]]
      ( expect myE[2].sendTo ).toEqual [myE_dummy[0]]