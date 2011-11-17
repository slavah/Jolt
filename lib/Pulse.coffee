# it would NOT be necessary to pass the queues as arguments, nor to export the
# defer/delay methods, if my build-test tool allowed me to create coupled
# bundles and test specs, whereby I could take components of the Jolt library,
# prefix them with "mocks" (and in a node.js context postfix them with the
# contents of the specs, thereby avoiding the use of require so as to get the
# "mocks" and the specs into the same scope); when my next-gen build-test tool
# (built *with* Jolt) is ready, I should bundle it with a specific Jolt release
# and then work on a new version of Jolt and test specs which have the then
# unnecessary test-enabling workarounds removed; then in turn a new version of
# the build-test tool can be tested and bundled with the new version of Jolt

lastStamp = 0
nextStamp = -> ++lastStamp

Jolt.isPropagating  = isPropagating = false
Jolt.setPropagating = setPropagating = (bool) -> isPropagating = Boolean bool

Jolt.doNotPropagate = doNotPropagate = {}
Jolt.propagateHigh  = propagateHigh  = {}

sendCall = name: (-> 'Jolt.sendEvent'), removeWeakReference: ->


# keep in mind the following when composing functions to call via defer
# https://bugzilla.mozilla.org/show_bug.cgi?id=394769
if isNodeJS
  Jolt.defer_high = defer_high = (func, args...) -> process.nextTick -> func args...
  Jolt.delay = delay = (func, ms, args...) -> setTimeout (-> func args...), ms
else
  Jolt.defer_high = defer_high = (func, args...) -> defer func, args...
  Jolt.delay = delay = (func, ms, args...) -> window.setTimeout (-> func args...), ms

Jolt.defer = defer = (func, args...) -> delay func, 0, args...


# this queue should be adjusted so that it is drained more quickly/slowly, both
# in terms of the delay ms value and how many tasks are shifted/exec'd in one
# step, if the queue length grows beyond a certain upper threshold; research
# should be conducted to find a robust algorithm, as certainly this project
# is not the first with such a need
Jolt.cleanupQ = cleanupQ = cleanupWeakReference = []
cleanupQ.draining = false
cleanupQ.freq = 100
cleanupQ.drain = ->
  if cleanupQ.length
    (cleanupQ.shift())()
    delay cleanupQ.drain, cleanupQ.freq
  else
    cleanupQ.draining = false

Jolt.scheduleCleanup = scheduleCleanup = (cleanupQ, sender, weakReference) ->
  if not cleanupQ then cleanupQ = cleanupWeakReference
  if not weakReference.cleanupScheduled
    weakReference.cleanupScheduled = true
    cleanupQ.push ->
      sender.removeWeakReference weakReference
    if not cleanupQ.draining
      cleanupQ.draining = true
      delay cleanupQ.drain, cleanupQ.freq


# this queue should be adjusted so that it is drained more quickly/slowly, both
# in terms of the delay ms value and how many tasks are shifted/exec'd in one
# step, with respect to the average number of tasks that remain for a "drain
# all" step that precedes pulse propagation; again, research is needed.......
Jolt.beforeQ = beforeQ = beforeNextPulse = []
beforeQ.draining = false
beforeQ.freq = 10
beforeQ.drain = ->
  if beforeQ.length
    (beforeQ.shift())()
    delay beforeQ.drain, beforeQ.freq
  else
    beforeQ.draining = false

Jolt.scheduleBefore = scheduleBefore = (beforeQ, func, args...) ->
  if not beforeQ then beforeQ = beforeNextPulse
  beforeQ.push ->
    func args...
  if not beforeQ.draining
    beforeQ.draining = true
    delay beforeQ.drain, beforeQ.freq


class HeapStore
  constructor: (@stamp) ->
    @nodes = []


Jolt.isP = isP = (pulse) ->
  pulse instanceof Pulse


Jolt.Pulse = class Pulse

  # stamp is unique and gives us a key with which to pair heaps and estreams
  constructor: (@arity, @junction, @sender, @stamp, @value, @heap = new HeapStore @stamp) ->

  # --- #

  propagate: (pulse, sender, receiver, high, more...) ->

    if not receiver.weaklyHeld
      if beforeQ.length and not high then (beforeQ.shift())() while beforeQ.length

      setPropagating true

      queue = new PriorityQueue

      queue.push estream: receiver, pulse: pulse, rank: receiver.rank

      while queue.size()
        qv = queue.pop()

        P = new (qv.estream.PulseClass()) qv.pulse.arity, \
        qv.pulse.junction, \
        qv.pulse.sender, \
        qv.pulse.stamp, \
        (qv.pulse.value.slice 0), \
        qv.pulse.heap

        P.heap.nodes.push qv.estream

        nextPulse = qv.estream.PulseClass().prototype.PROPAGATE P, \
        P.sender, \
        qv.estream, \
        high, \
        more...

        weaklyHeld = true

        if nextPulse isnt doNotPropagate
          nextPulse.sender = qv.estream

          _( qv.estream.sendTo ).map (receiver) ->
            weaklyHeld = weaklyHeld and receiver.weaklyHeld
            if receiver.weaklyHeld
              scheduleCleanup cleanupQ, qv.estream, receiver
            else
              queue.push estream: receiver, pulse: nextPulse, rank: receiver.rank

          if qv.estream.sendTo.length and weaklyHeld
            qv.estream.weaklyHeld = true
            scheduleCleanup cleanupQ, qv.pulse.sender, qv.estream

      setPropagating false

      P.heap

    else
      scheduleCleanup cleanupQ, sender, receiver

      pulse.heap


  PROPAGATE: (pulse, sender, receiver, high, more...) ->

    # in non-catching scenarios (i.e. _PulseClass isnt Pulse_cat) in
    # catching/finally branches, if this step results in an error being thrown
    # then isPropagating will be "stuck true", so it's important that estreams
    # attached to CATCH_E and FINALLY_E bet set to use Pulse_cat

    PULSE = receiver.UPDATER pulse

    if PULSE isnt doNotPropagate and not (isP PULSE)
      setPropagating false
      throw 'receiver\'s UPDATER did not return a pulse object'
    else
      PULSE
