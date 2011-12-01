lastRank = 0
nextRank = -> ++lastRank


Jolt.isE = isE = (estream) ->
  (estream instanceof EventStream) and not (isB estream)


Jolt.EventStream = class EventStream

  constructor: (recvFrom...) ->

    @rank = nextRank()
    @absRank = @rank

    @sendTo = []

    if recvFrom.length
      (estream.attachListener this) for estream in (_.flatten [ recvFrom... ])

  attachListener: (receiver) ->
    if not isE receiver
      throw '<' + @ClassName + '>.attachListener: expected an EventStream'
    @constructor.genericAttachListener this, receiver
    this

  removeListener: (receiver) ->
    if not isE receiver
      throw '<' + @ClassName + '>.removeListener: expected an EventStream'
    @constructor.genericRemoveListener this, receiver
    this

  removeWeakReference: (weakReference) ->
    if not isE weakReference
      throw '<' + @ClassName + '>.removeWeakReference: expected an EventStream'
    @constructor.genericRemoveWeakReference this, weakReference
    this

  ClassName: 'EventStream'

  cleanupScheduled: false

  @genericAttachListener = (sender, receiver) ->
    if not isPropagating()
      if sender.rank is receiver.rank
        throw '<' + sender.ClassName + '>.attachListener: cycle detected in propagation graph'
      i = _.indexOf sender.sendTo, receiver
      if not (i + 1)
        receiver.weaklyHeld = false
        sender.sendTo.push receiver
        if sender.rank > receiver.rank
          doNextRank = []
          sentinel = {}
          sender.__cycleSentinel__ = sentinel
          q = [ receiver ]
          while q.length
            cur = q.shift()
            if cur.__cycleSentinel__ is sentinel
              sender.sendTo.pop()
              throw '<' + sender.ClassName + '>.attachListener: cycle detected in propagation graph'
            doNextRank.push cur
            cur.__cycleSentinel__ = sentinel
            q.push cur.sendTo...
          (estream.rank = nextRank()) for estream in doNextRank
    else
      thisClass = this
      scheduleBefore beforeQ, ((sender, receiver) -> thisClass.genericAttachListener sender, receiver), sender, receiver

  @genericRemoveListener = (sender, receiver) ->
    if not isPropagating()
      i = _.indexOf sender.sendTo, receiver
      if (i + 1) then sender.sendTo.splice i, 1
    else
      thisClass = this
      scheduleBefore beforeQ, ((sender, receiver) -> thisClass.genericRemoveListener sender, receiver), sender, receiver

  @genericRemoveWeakReference = (sender, weakReference) ->
    weakReference.cleanupScheduled = false
    if weakReference.weaklyHeld
      if not isPropagating()
        i = _.indexOf sender.sendTo, weakReference
        if (i + 1) then sender.sendTo.splice i, 1
        if not sender.sendTo.length then sender.weaklyHeld = true
      else
        scheduleCleanup cleanupQ, sender, weakReference

  _mode: null
  mode: (mode) ->
    if not arguments.length then return @_mode
    if not mode?
      @_mode = null
      return this
    switch mode
      when 'sequenced', 's'
        @_mode = 'sequenced'
      when 'vectored', 'v'
        @_mode = 'vectored'
      when 'zipped', 'z'
        @_mode = 'zipped'
      else throw '<' + @ClassName + '>.mode: ' + JSON.stringify(mode) + ' is not a valid mode'
    this
  null: ->
    @mode null
  s: ->
    @mode 'sequenced'
  sequenced: -> @s()
  v: ->
    @mode 'vectored'
  vectored: -> @v()
  z: ->
    @mode 'zipped'
  zipped: -> @z()

  _name: null
  name: (str) ->
    if not arguments.length then return @_name
    if not _.isString str
      throw '<' + @ClassName + '>.name: argument must be a string'
    @_name = str
    this

  _nary: false
  nary: ->
    @_nary = true
    this
  isNary: (bool) ->
    if not arguments.length then return @_nary
    @_nary = Boolean bool
    this

  no_null_junc: false

  _PulseClass: Pulse
  PulseClass: (klass) ->
    if not arguments.length then return @_PulseClass
    if not (_.isFunction klass)
      throw '<' + @ClassName + '>.PulseClass: argument must be a function'
    if not (isP new klass)
      throw '<' + @ClassName + '>.PulseClass: argument does not construct an instanceof Pulse'
    @_PulseClass = klass
    this

  seq_junc_helper: (pulse) ->
    ret = []
    for jp in pulse.value
      if jp.junction
        ret = ret.concat (@seq_junc_helper jp)
      else
        ret = ret.concat jp.value
    ret

  vec_junc_helper: (pulse) ->
    ret = []
    for jp in pulse.value
      if jp.junction
        ret = ret.concat (@vec_junc_helper jp)
      else
        ret.push jp.value
    ret

  zip_junc_helper: (pulse) ->
    _.zip (@vec_junc_helper pulse)...

  tranRCV: (pulse) ->
    switch @mode()
      when 'sequenced'
        if pulse.junction
          pulse.value = @seq_junc_helper pulse
        else
          return pulse
      when 'vectored'
        if pulse.junction
          pulse.value = @vec_junc_helper pulse
        else
          pulse.value = [ pulse.value ]
          pulse.arity = 1
          return pulse
      when 'zipped'
        if pulse.junction
          pulse.value = @zip_junc_helper pulse
        else
          pulse.value = _.zip pulse.value
          return pulse
      when null
        if pulse.junction and @no_null_junc
          throw '<' + @ClassName + '>.transRCV: does not support null mode for pulse junctions'
        else
          return pulse
      else
        throw '<' + @ClassName + '>.transRCV: bad mode value ' + (JSON.stringify @mode())

    pulse.arity = pulse.value.length
    pulse.junction = false

    pulse

  tranOUT: (pulse) ->
    if (pulse isnt doNotPropagate) and @isNary()
      ret = []
      (ret = ret.concat value) for value in pulse.value
      pulse.value = ret

    pulse

  tranVAL: (pulse) ->
    switch @mode()
      when null, 'sequenced'
        ret = @updater pulse.value...
        if ret is doNotPropagate
          pulse = ret
        else
          pulse.value = ret
      when 'vectored', 'zipped'
        thisClass = this
        ret = []
        for value in pulse.value
          iret = @updater value...
          if iret isnt doNotPropagate
            ret.push iret
        if ret.length is 0
          pulse = doNotPropagate
        else
          pulse.value = ret
      else
        throw '<' + @ClassName + '>.UPDATER: bad mode value ' + (JSON.stringify @mode())

    pulse

  updater: (value...) -> value

  UPDATER: (pulse) -> @tranOUT @tranVAL @tranRCV pulse

  weaklyHeld: false


Jolt.sendEvent = sendEvent = (estream, vals...) ->
  cont = undefined
  cont_maybe = vals[vals.length - 1]
  if cont_maybe instanceof ContInfo
    cont = cont_maybe
    vals.pop()
  high = false
  if cont
    high_maybe = vals[vals.length - 1]
  else
    high_maybe = cont_maybe
  if high_maybe is propagateHigh
    high = true
    vals.pop()
  heap = undefined
  PulseClass = estream.PulseClass()
  pulse = new PulseClass vals.length, false, sendCall, nextStamp(), vals, heap, cont
  pulse.propagate sendCall, estream, high
  undefined


# `Jolt.Behavior` is stubbed in here, though the working re/definition is given
# in [Behavior.cofee](Behavior.html)
Jolt.Behavior = class Behavior extends EventStream


# For `Jolt.isE` to operate prior to the working definition of `Jolt.Behavior`,
# `Jolt.isB` needs its own working definition.
Jolt.isB = isB = (behavior) ->
  behavior instanceof Behavior
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
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
