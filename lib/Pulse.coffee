# Each propagation cycle is (supposed to be) "stamped" with a unique value. In
# practice this means using `nextStamp` to generate an always-increasing integer
# value which is then passed to the `Pulse` or subclass constructor.

lastStamp = 0
nextStamp = -> ++lastStamp


# `Pulse` propagation is, by design, a synchronous operation which in terms of
# Jolt's own algorightms should always be computationally finite. Practically,
# this means disallowing modification of event propagation graphs during
# propagation. The `propagating` flag is therefore toggled at the beginning
# and end of propagation cycles, by way of its setter function
# `Jolt.setPropagating`. `EventStream` methods which affect node-relationships
# use the getter function `Jolt.isPropagating` to determine whether they should
# proceed or schedule themselves for execution outside of a popagation cycle.

propagating = false

Jolt.isPropagating  = isPropagating  = -> propagating
Jolt.setPropagating = setPropagating = (bool) -> propagating = Boolean bool


# `Jolt.doNotPropagate` is a sentinel value which signals that event propagation
# should be halted in the emitting node's branch of a propagation graph.

Jolt.doNotPropagate = doNotPropagate = {}


# `Jolt.propagateHigh` is a unique value which when passed as the last argument
# to `Jolt.sendEvent` signals the `<Pulse>.propagate` method to invoke its
# `high` logic.

Jolt.propagateHigh  = propagateHigh  = {}


# `sendCall` facilitates the always imperatively called method `Jolt.sendEvent`
# being named and treated as the first node in a propagation cycle, though it's not
# properly a node in the graph.

sendCall = name: (-> 'Jolt.sendEvent'), removeWeakReference: ->


# Various graph modification and linking operations sometimes need to be delayed
# across a trip around the runtime's event loop. And some of these operations
# are queued and may be executed at a later time, and over time, to avoid
# unecessarily completing them all at once, thus freeing up the CPU.
# `Jolt.delay`, `Jolt.defer`, and `Jolt.defer_high` act as simple wrappers
# around the runtime's `setTimeout` facility, and `process.nextTick` in the case
# of node.js. The following "bug" affecting mozilla-derived runtimes should be
# kept in mind when composing functions to call through `Jolt.defer`:
# [https://bugzilla.mozilla.org/show_bug.cgi?id=394769](https://bugzilla.mozilla.org/show_bug.cgi?id=394769)

if isNodeJS
  Jolt.defer_high = defer_high = (func, args...) -> process.nextTick -> func args...
  Jolt.delay = delay = (func, ms, args...) -> setTimeout (-> func args...), ms
else
  Jolt.defer_high = defer_high = (func, args...) -> defer func, args...
  Jolt.delay = delay = (func, ms, args...) -> window.setTimeout (-> func args...), ms

Jolt.defer = defer = (func, args...) -> delay func, 0, args...


# If an `EventStream` instance is flagged as "weaklyHeld", as observed during
# event propagation, it should be pruned from the `sendTo` array-property of the
# node in the propagation graph which referenced it. Such "cleanup" operations
# are queued in `Jolt.cleanupQ`. The current implementation of the queue's
# "drain" method is a bit naive. A future implementation should self-adjust its
# timing so the queue is drained more quickly/slowly, both in terms of the
# delay `ms` value and how many tasks are shifted/exec'd in one step, if the
# queue length grows beyond a certain upper threshold.

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


# Propagation graph modifications are disallowed during propagation, and any
# such operations attempted during propagation are automatically deferred by
# queueing them in `Jolt.beforeQ`. The "before" in the name is related to the
# design whereby all operations queued in `beforeQ` will be completed prior
# the first step in the next event propagation cycle. The queue will attempt
# to drain itself, one op at a time, and over time, prior to the next
# propagation. But if any ops remain in the queue when a propagation is
# initiated, the queue will be fully drained synchronously beforehand. The
# current implementation of this queue's "drain" method is also a bit naive. A
# future implementation should self-adjust its timing so the queue is drained
# more quickly/slowly, both in terms of the delay `ms` value and how many tasks
# are shifted/exec'd in one step, with respect to the average number of tasks
# that remain for the "drain all" step that precedes event propagation.

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


# Event propagation order among `EventStream` instances (estreams) that form a
# propagation graph is governed a binary heap algorithm. As an event propagates
# through the graph, each step is recorded along the way in an instance of
# `HeapStore`.

class HeapStore
  constructor: (@stamp) ->
    @nodes = []

# Propagation is mediated by instances of `Jolt.Pulse`, and `Jolt.isP` helps
# guarantee that objects passed between estreams during `propagate`/`update`
# cycles are such instances.

Jolt.isP = isP = (pulse) ->
  pulse instanceof Pulse


Jolt.Pulse = class Pulse

  # Instances of `Jolt.Pulse` have a set of properties which affect how they are
  # processed by recipient estreams, though some of them have a more forensic
  # character. `arity` is an integer value which indicates how many discrete
  # pieces of data are carried by a particular pulse, and likewise how many
  # arguments will be passed to a receiving estream's inner value transformer.
  # `junction` is a boolean which indicates whether a `Pulse` instance is a
  # "plain" pulse or a "junction of pulses". `sender` is a reference to the
  # sending estream (or `Jolt.sendEvent` call). `stamp` is a unique value, an
  # integer, which is incremented before each propagation cycle. `value` is an
  # array (of length `arity`) which contains the data mediated by the pulse.
  # `heap` is an instance of `HeapStore` and records the propagation steps; as
  # `stamp` is unique, it gives us a key with which to pair heaps and estreams.
  constructor: (@arity, @junction, @sender, @stamp, @value, @heap = new HeapStore @stamp) ->

  copy: (PulseClass) ->
    PulseClass ?= @constructor
    new PulseClass @arity, @junction, @sender, @stamp, (@value.slice 0), @heap

  propagate: (sender, receiver, high, more...) ->

    if not receiver.weaklyHeld
      if beforeQ.length and not high then (beforeQ.shift())() while beforeQ.length

      setPropagating true
      queue = new PriorityQueue
      queue.push estream: receiver, pulse: this, rank: receiver.rank

      while queue.size()
        qv = queue.pop()

        PULSE = qv.pulse.copy qv.estream.PulseClass()
        PULSE.heap.nodes.push qv.estream

        nextPulse = PULSE.PROPAGATE PULSE.sender, \
        qv.estream, \
        high, \
        more...

        weaklyHeld = true

        if nextPulse isnt doNotPropagate
          nextPulse.sender = qv.estream

          for receiver in qv.estream.sendTo
            weaklyHeld = weaklyHeld and receiver.weaklyHeld
            if receiver.weaklyHeld
              scheduleCleanup cleanupQ, qv.estream, receiver
            else
              queue.push estream: receiver, pulse: nextPulse, rank: receiver.rank

          if qv.estream.sendTo.length and weaklyHeld
            qv.estream.weaklyHeld = true
            scheduleCleanup cleanupQ, qv.pulse.sender, qv.estream

      setPropagating false
      PULSE.heap

    else
      scheduleCleanup cleanupQ, sender, receiver
      @heap


  PROPAGATE: (sender, receiver, high, more...) ->

    # in non-catching scenarios (i.e. _PulseClass isnt Pulse_cat) in
    # catching/finally branches, if this step results in an error being thrown
    # then isPropagating will be "stuck true", so it's important that estreams
    # attached to CATCH_E and FINALLY_E bet set to use Pulse_cat

    PULSE = receiver.UPDATER this

    if PULSE isnt doNotPropagate and not (isP PULSE)
      setPropagating false
      throw 'receiver\'s UPDATER did not return a pulse object'
    else
      PULSE
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
# <<<>>>
#
# Jolt - Reactive Objects for JavaScript
#
# [https://github.com/projexsys/Jolt](https://github.com/projexsys/Jolt)
#
# This software is Copyright (c) 2011 by Projexsys, Inc.
#
# This is free software, licensed under:
#
# The GNU General Public License Version 3
#
# The JavaScript and/or CoffeeScript code developed and owned by
# Projexsys, Inc. presented in this page is free software: you can
# redistribute it and/or modify it under the terms of the GNU General
# Public License (GNU GPL) as published by the Free Software
# Foundation, either version 3 of the License, or (at your option) any
# later version. The code is distributed WITHOUT ANY WARRANTY; without
# even the implied warranty of MERCHANTABILITY or FITNESS FOR A
# PARTICULAR PURPOSE. See the GNU GPL for more details:
#
# [https://raw.github.com/projexsys/Jolt/master/LICENSE](https://raw.github.com/projexsys/Jolt/master/LICENSE)
# [http://www.gnu.org/licenses/gpl-3.0.txt](http://www.gnu.org/licenses/gpl-3.0.txt)
#
# However, if you have executed an End User Software License and
# Services Agreement or an OEM Software License and Support Services
# Agreement, or another commercial license agreement with Projexsys,
# Inc. (each, a "Commercial Agreement"), the terms of the license in
# such Commercial Agreement will supersede the GNU GENERAL PUBLIC
# LICENSE Version 3 and you may use the Software solely pursuant to the
# terms of the relevant Commercial Agreement.
#
# This sofware is derived from and incorporates existing works. For
# further information and license texts please refer to:
#
# [https://raw.github.com/projexsys/Jolt/master/LICENSES](https://raw.github.com/projexsys/Jolt/master/LICENSES)
