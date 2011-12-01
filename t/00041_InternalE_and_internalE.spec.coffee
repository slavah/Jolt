isNodeJS = Boolean process?.pid

if isNodeJS
  path = require 'path'
  Jolt = require path.normalize process.cwd() + '/../index'

beforeEach ->
  Jolt.globalize()

describe 'Jolt.InternalE', ->

  it '''
    should construct an EventStream which passes the 'isE' test
  ''', ->

    expect(isE new InternalE).toBe(true)


describe 'Jolt.InternalE.factory', ->

  it '''
    should return an InternalE instance, which is inserted into the 'sendTo'
    array-property of the EventStream / InternalE instances passed to the
    constructor
  ''', ->

    myE = []
    myE[1] = new EventStream
    myE[2] = new InternalE
    myE[3] = new EventStream
    myE[4] = new InternalE

    myE[5] = InternalE.factory [myE[1]], myE[2], [myE[3], myE[4]]

    ( expect myE[5].ClassName ).toBe 'InternalE'
    ( expect myE[i].sendTo[0] ).toBe myE[5] for i in [1..4]


describe 'Jolt.internalE', ->

  it '''
    should return an InternalE instance which passes the 'isE' test
  ''', ->

    expect(isE internalE()).toBe(true)

  it '''
    should return an InternalE instance, which is inserted into the 'sendTo'
    array-property of the EventStream / InternalE instances passed to the
    constructor
  ''', ->

    myE = []
    myE[1] = internalE()
    myE[2] = internalE()
    myE[3] = new EventStream
    myE[4] = internalE()

    myE[5] = internalE myE[1], myE[2], [myE[3]], myE[4]

    ( expect myE[5].ClassName ).toBe 'InternalE'
    ( expect myE[i].sendTo[0] ).toBe myE[5] for i in [1..4]


describe 'EventStream_api.prototype.internalE', ->

  it '''
    it should work in the same manner as unbound internalE, as if the
    EventStream which has this method called is the first of the arguments
    passed to Jolt.internalE
  ''', ->

    myE = []
    myE[1] = internalE()
    myE[2] = myE[1].internalE()

    ( expect isE myE[2]       ).toBe true
    ( expect myE[2].ClassName ).toBe 'InternalE'
    ( expect myE[1].sendTo[0] ).toBe myE[2]

    myE[3] = internalE()
    myE[4] = internalE()
    myE[5] = internalE()

    myE[6] = myE[3].internalE(myE[5], myE[4])

    ( expect myE[i].sendTo[0] ).toBe myE[6] for i in [3..5]
