isNodeJS = Boolean process?.pid

if isNodeJS
  path = require 'path'
  Jolt = require path.normalize process.cwd() + '/../index'

beforeEach ->
  Jolt.globalize()

describe 'Jolt.ZeroE', ->

  it '''
    should...
  ''', ->

    myZ = zeroE()

    ( expect -> sendEvent myZ, 1, 2, 3 ).toThrow '<ZeroE>.UPDATER: received a pulse; an instance of ZeroE should never receive a pulse'

    # throwing an error in UPDATER (which is how ZeroE is defined) causes Jolt's
    # 'propagating' flag to be "stuck true", so we need manually set it to
    # false; this brings up a larger issue re: Jolt's scheduler and propagating
    # flag design, which needs some careful thought; for one, it may be better
    # in the case of classes like OneE and ZeroE to not throw an error via
    # UPDATER, but instead return doNotPropagate and log to the console with
    # Jolt.sayError; however, in the general case, it may be important to think
    # about manually setting propagating false prior to throwing an error, e.g.
    # in attachListener when an isE test fails; but then that introduces a need
    # to manually check and/or set it back to true when Pulse_cat is in effect;
    # and for errors introduced from code external to the Jolt library, it
    # means, I think, documenting the need to set propagating false when catching
    # exceptions apart from using Pulse_cat ... again, much thought is needed
    #setPropagating false
