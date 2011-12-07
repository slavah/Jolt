# Each propagation cycle is (supposed to be) "stamped" with a unique value. In
# practice this means using `nextStamp` to generate an always-increasing integer
# value which is then passed to the `Pulse` or subclass constructor.

lastStamp = 0
Jolt.nextStamp = nextStamp = -> ++lastStamp


# (stray annotation following deprecation of `propagating` flag/logic, find it a
# home elsewhere, ast it still conveys design philosophy of Jolt) `Pulse`
# propagation is, by design, a synchronous operation which in terms of Jolt's
# own algorightms should always be computationally finite. Practically, this
# means disallowing modification of event propagation graphs during propagation.

# `Jolt.doNotPropagate` is a sentinel value which signals that event propagation
# should be halted in the emitting node's branch of a propagation graph.

Jolt.doNotPropagate = doNotPropagate = {}
doNotPropagate.copy = -> this


# `Jolt.propagateHigh` is a unique value which when passed as the last argument
# to `Jolt.sendEvent` signals `Pulse.prototype.propagate` to invoke its `high`
# logic.

#Jolt.propagateHigh = propagateHigh = {}
Jolt.scheduleHigh  = scheduleHigh  = {}
Jolt.scheduleMid   = scheduleMid   = {}
Jolt.scheduleNorm  = scheduleNorm  = {}

Jolt.linkHigh      = linkHigh      = {}
Jolt.linkTight     = linkTight     = {}


# `sendCall` facilitates `Jolt.sendEvent` being named and treated as the first
# node in a propagation cycle, though it's not properly a node in the graph.

Jolt.sendCall = sendCall = name: (-> 'Jolt.sendEvent'), removeWeakReference: ->


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
      sender.removeWeakReference weakReference, true
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

Jolt.beforeQ = beforeQ = beforeNextPulse = high: [], mid: [], norm: []
beforeQ.drainingHigh = false
beforeQ.drainingMid  = false
beforeQ.drainingNorm = false
beforeQ.norm.freq = 10
beforeQ.drainHigh = ->
  if beforeQ.high.length
    defer_high beforeQ.drainHigh
    (beforeQ.high.shift())()
  else
    beforeQ.drainingHigh = false
beforeQ.drainMid = ->
  if beforeQ.mid.length
    defer beforeQ.drainMid
    (beforeQ.mid.shift())()
  else
    beforeQ.drainingMid = false
beforeQ.drainNorm = ->
  if beforeQ.norm.length
    delay beforeQ.drainNorm, beforeQ.norm.freq
    if not beforeQ.drainingHigh
      (beforeQ.norm.shift())()
  else
    beforeQ.drainingNorm = false
#beforeQ.drainAll = ->
#  if beforeQ.high.length
#    (beforeQ.high.shift())() while beforeQ.high.length
#  if beforeQ.mid.length
#    (beforeQ.mid.pop())() while beforeQ.mid.length
#  if beforeQ.norm.length
#    (beforeQ.norm.shift())() while beforeQ.norm.length

Jolt.scheduleBefore = scheduleBefore = (beforeQ, func, args...) ->
  if not beforeQ then beforeQ = beforeNextPulse
  which  = scheduleNorm
  _which = args[args.length - 1]
  if (_which is scheduleHigh) or (_which is scheduleMid) or (_which is scheduleNorm)
    which = _which
    args.pop()
  switch which
    when scheduleHigh
      beforeQ.high.push ->
        func args...
      if not beforeQ.drainingHigh
        beforeQ.drainingHigh = true
        defer_high beforeQ.drainHigh
    when scheduleMid
      beforeQ.mid.push ->
        func args...
      if not beforeQ.drainingMid
        beforeQ.drainingMid = true
        defer beforeQ.drainMid
    when scheduleNorm
      beforeQ.norm.push ->
        func args...
      if not beforeQ.drainingNorm
        beforeQ.drainingNorm = true
        delay beforeQ.drainNorm, beforeQ.norm.freq


# Event propagation order among `EventStream` instances (estreams) that form a
# propagation graph is governed by a binary heap algorithm. As an event
# propagates through the graph, each step is recorded along the way in an
# instance of `HeapStore`.

Jolt.HeapStore = class HeapStore
  constructor: (@stamp, @cont) ->
    @nodes = []

# Some `EventStream` transformers involve asynchronous *continuations* of event
# propagation. This results in disjointed propagation graphs since behind the
# scenes it involves at least two separate calls to `Jolt.sendEvent`. However,
# the constructor for Jolt's `Pulse` class allows an instance of `Jolt.ContInfo`
# ("continuation information") to be passed into the instance of
# `Jolt.HeapStore` which is constructed and stored in the returned instance of
# `Pulse` (or a subclass). The `ContInfo` instance tracks which heap/s
# (referenced by `stamp`) and estream/s were the origin of the continued
# propagation. The recorded information does not directly affect the program's
# operation, but is useful for runtime analysis.

Jolt.ContInfo = class ContInfo
  constructor: (@stamps, @nodes) ->

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
  # `heap` is an instance of `HeapStore` and records the propagation steps.

  constructor: (@arity, @junction, @sender, @stamp, @value = [], @heap = (new HeapStore @stamp, cont), cont) ->

  # `Pulse.prototype.copy` clones the properties of a `Pulse` instance to a new
  # instance, with the option that a derived class/constructor is used instead
  # of the old instance's constructor.

  copy: (PulseClass) ->
    PulseClass ?= @constructor
    new PulseClass @arity, @junction, @sender, @stamp, (@value.slice 0), @heap

  # The invocation of `Pulse.prototype.propagate` is the first step in an event
  # propagation cycle. Though `sender` could be extracted from a well-formed
  # `Pulse` instance, having it as a named argument lends clarity, particularly
  # in more "advanced" dertivates of the `Pulse` class. The arguments splat
  # `more...` also facilitates derivate implementations which need additional
  # control flags.

  propagate: (sender, receiver, more...) ->

    # If an estream is flagged as `weaklyHeld` then propagation will halt
    # immediately and a cleanup op gets scheduled (in the corresponding `else`
    # clause near the bottom of the script). Tasks which remain queued in
    # `Jolt.beforeQ` (e.g. graph modifications) need to be drained and executed
    # before propagation can proceed, though this step is skipped if the `high`
    # argument is true.

    if not receiver.weaklyHeld
      #if (beforeQ.high.length or beforeQ.norm.length) and not high then beforeQ.drainAll()

      # The next step is to make an instance of `Jolt.PriorityQueue` and
      # populate it with the initial receiver. Queue members are hashes with
      # keys `estream`, `pulse`, and `rank`.

      queue = new PriorityQueue
      queue.push estream: receiver, pulse: this, rank: receiver.rank

      # The bulk of the work done by `propagate` takes the form a while loop
      # which alternately drains and populates the queue with the estream nodes
      # that make up the event propagation graph.

      while queue.size()
        qv = queue.pop()

        # For each step of the propagation cycle, the `sender` and `receiver`
        # are recorded as a tuple in the instance of `Jolt.HeapStore`.

        qv.pulse.heap.nodes.push [qv.pulse.sender, qv.estream]

        # To avoid unwanted side effects during event propagation, each receiving
        # estream is passed a new instance of `Pulse` (or a subclass) with the
        # properties copied from the old one. The choice of constructor
        # (`PulseClass`) for the `copy` operation is determined by the
        # `_PulseClass` property of the receiving estream.

        PULSE = qv.pulse.copy qv.estream.PulseClass()

        # The next major step in the propagation cycle is the hand-off to the
        # "inner propagation" method, `Pulse.prototype.PROPAGATE`. The return
        # value, which is the result of transformations performed by the
        # receiving estream, forms the basis of the succeeding steps in the
        # cycle.

        nextPulse = PULSE.PROPAGATE PULSE.sender, qv.estream, more...

        # Certain estream transformers rely on logic whereby parent nodes in a
        # propagation graph should be flagged as `weaklyHeld` if all their child
        # nodes become so flagged. Using some combinatorial logic, we can detect
        # such conditions without having to iterate an estream's `sendTo` array
        # explicitly for this purpose. The variable `weaklyHeld` lets us do
        # this.

        weaklyHeld = true

        # If `PROPAGATE` returned the sentinel value `Jolt.doNotPropagate`, then
        # popagation will not continue with members (if any) of the receiver's
        # `sendTo` array property.

        if nextPulse isnt doNotPropagate
          nextPulse.sender = qv.estream

          # If `PROPAGATE` returned a `Pulse` instance, then the next step
          # involves pushing members of the receiver's `sendTo` array-property
          # into the instance of `PriorityQueue` created at the beginning of the
          # cycle.

          for receiver in qv.estream.sendTo

            # If any members of the receiver's child nodes are not flagged as
            # `weaklyHeld` then we know to not flag the receiver, since the
            # `weaklyHeld` variable will have been set to false.

            weaklyHeld = weaklyHeld and receiver.weaklyHeld

            # If an estream is flagged as `weaklyHeld`, it's not added to the
            # queue, and a "cleanup" operation is scheduled

            if receiver.weaklyHeld
              qv.estream.removeWeakReference receiver
              #scheduleCleanup cleanupQ, qv.estream, receiver
            else

              # Each child receiver is paired with `nextPulse`, though note that
              # `Pulse` instance has been modified so that its `sender` value
              # references the parent node which transformed the original
              # `Pulse` instance.

              queue.push estream: receiver, pulse: nextPulse, rank: receiver.rank

          # If the original receiver had been flagged as `weaklyHeld` the
          # `propagate` logic would not have proceeded thus far. Since it did,
          # we should only consider the `weaklyHeld` variable's having a true
          # value as indicating the original receiver should be so flagged if
          # the receiver has a non-empty `sendTo` array property, i.e. it has
          # child nodes that were all flagged as `weaklyHeld`. If the original
          # receiver does end up flagged, then a "cleanup" op is scheduled for
          # it.

          if qv.estream.sendTo.length and weaklyHeld
            qv.estream.weaklyHeld = true
            qv.pulse.sender.removeWeakReference qv.estream
            #scheduleCleanup cleanupQ, qv.pulse.sender, qv.estream

      # The propagation cycle is ended by setting the `propagate` flag to false
      # and returning the instance of `HeapStore`

      PULSE.heap

    else
      sender.removeWeakReference receiver
      #scheduleCleanup cleanupQ, sender, receiver
      @heap


  PROPAGATE: (sender, receiver, more...) ->

    # The "inner propagation" method, `Pulse.prototype.PROPAGATE`, invokes the
    # "transformation" steps (for each receiving estream) of the propagation
    # cycle -- the `Pulse` instance is passed to the receiving estream's "outer
    # updater" method, `EventStream.prototype.UPDATER`.

    PULSE = receiver.UPDATER this

    # The value returned by `UPDATER` should be either an instance of `Pulse` or
    # the sentinel value `Jolt.doNotPropagate`. If that's not the case, an error
    # is thrown. Otherwise, the transformed `Pulse` instance is returned into
    # the continued logic of `Pulse.prototype.propagate`.

    if PULSE isnt doNotPropagate and not (isP PULSE)
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
