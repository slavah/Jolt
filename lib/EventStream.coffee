lastRank = 0
nextRank = -> ++lastRank


Jolt.isE = isE = (estream) ->
  estream instanceof EventStream


Jolt.EventStream = class EventStream

  constructor: (recvFrom...) ->

    @rank = nextRank()
    @absRank = @rank

    @sendTo = []
    @linkTo = []

    if recvFrom.length
      (estream.attachListener this) for estream in (_.flatten [ recvFrom... ])

  expAnEstreamErr = 'expected an EventStream'

  attachListener: (receiver, now = false) ->
    if _.isArray receiver
      receiver = _.flatten receiver
    else
      receiver = [ receiver ]
    for rcvr in receiver
      if not isE rcvr
        throw '<' + @ClassName + '>.attachListener: ' + expAnEstreamErr
      if now
        @constructor.genericAttachListener this, rcvr
      else
        scheduleBefore beforeQ, ((sender, receiver) -> sender.attachListener receiver, true), this, rcvr
      this

  removeListener: (receiver, now = false) ->
    if _.isArray receiver
      receiver = _.flatten receiver
    else
      receiver = [ receiver ]
    for rcvr in receiver
      if not isE rcvr
        throw '<' + @ClassName + '>.removeListener: ' + expAnEstreamErr
      if now
        @constructor.genericRemoveListener this, rcvr
      else
        scheduleBefore beforeQ, ((sender, receiver) -> sender.removeListener receiver, true), this, rcvr
      this

  removeWeakReference: (weakReference, now = false) ->
    if not isE weakReference
      throw '<' + @ClassName + '>.removeWeakReference: ' + expAnEstreamErr
    if now
      @constructor.genericRemoveWeakReference this, weakReference
    else
      scheduleCleanup cleanupQ, this, weakReference
    this

  ClassName: 'EventStream'

  cleanupScheduled: false

  cycleError = '.genericAttachListener: cycle detected in propagation graph'

  @genericAttachListener = (sender, receiver) ->
    if sender.rank is receiver.rank
      throw sender.ClassName + cycleError
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
            throw sender.ClassName + cycleError
          doNextRank.push cur
          cur.__cycleSentinel__ = sentinel
          q.push cur.sendTo...
        (estream.rank = nextRank()) for estream in doNextRank
    undefined

  @genericRemoveListener = (sender, receiver) ->
    i = _.indexOf sender.sendTo, receiver
    if (i + 1) then sender.sendTo.splice i, 1
    undefined

  @genericRemoveWeakReference = (sender, weakReference) ->
    weakReference.cleanupScheduled = false
    if weakReference.weaklyHeld
      i = _.indexOf sender.sendTo, weakReference
      if (i + 1) then sender.sendTo.splice i, 1
      if not sender.sendTo.length then sender.weaklyHeld = true
    undefined

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

  _recur: false
  recur: ->
    @_recur = true
    this
  doesRecur: (bool) ->
    if not arguments.length then return @_recur
    @_recur = Boolean bool
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

  seq_junc_helper: (value) ->
    retval = []
    for jp in value
      if jp.junction
        retval = retval.concat (@seq_junc_helper jp.value)
      else
        retval = retval.concat jp.value
    retval

  vec_junc_helper: (value) ->
    retval = []
    for jp in value
      if jp.junction
        retval = retval.concat (@vec_junc_helper jp.value)
      else
        retval.push jp.value
    retval

  zip_junc_helper: (value) ->
    _.zip (@vec_junc_helper value)...

  tranIN: (pulse) ->
    PULSE = pulse.copy()
    switch @mode()
      when 'sequenced'
        if PULSE.junction
          PULSE.value = @seq_junc_helper PULSE.value
        else
          return PULSE
      when 'vectored'
        if PULSE.junction
          PULSE.value = @vec_junc_helper PULSE.value
        else
          PULSE.value = [ PULSE.value ]
          PULSE.arity = 1
          return PULSE
      when 'zipped'
        if PULSE.junction
          PULSE.value = @zip_junc_helper PULSE.value
        else
          PULSE.value = _.zip PULSE.value
          return PULSE
      when null
        if PULSE.junction and @no_null_junc
          throw '<' + @ClassName + '>.tranIN: does not support null mode for pulse junctions'
        else
          return PULSE
      else
        throw '<' + @ClassName + '>.tranIN: bad mode value ' + (JSON.stringify @mode())

    PULSE.arity = PULSE.value.length
    PULSE.junction = false

    PULSE

  tranOUT: (pulse) ->
    PULSE = pulse.copy()
    if (PULSE isnt doNotPropagate) and @isNary()
      PULSE.value = [].concat PULSE.value...

    PULSE

  tranVAL: (pulse) ->
    PULSE = pulse.copy()
    switch @mode()
      when null, 'sequenced'
        ret = @updater PULSE.value...
        if ret is doNotPropagate
          PULSE = ret
        else
          PULSE.value = ret
      when 'vectored', 'zipped'
        ret = []
        for value in PULSE.value
          iret = @updater value...
          if iret isnt doNotPropagate
            ret.push iret
        if ret.length is 0
          PULSE = doNotPropagate
        else
          if @doesRecur()
            redval = [].concat ret...
            if @isNary()
              redval = [].concat redval...
            redret = @updater redval...
            if redret is doNotPropagate
              PULSE = redret
            else
              PULSE.value = redret
          else
            PULSE.value = ret
      else
        throw '<' + @ClassName + '>.UPDATER: bad mode value ' + (JSON.stringify @mode())

    PULSE

  updater: (value...) -> value

  UPDATER: (pulse) -> @tranOUT @tranVAL @tranIN pulse

  weaklyHeld: false


Jolt.sendEvent_nodrain = sendEvent_nodrain = (estream, value...) ->
  cont = undefined
  cont_maybe = value[value.length - 1]
  if cont_maybe instanceof ContInfo
    cont = cont_maybe
    value.pop()
  heap = undefined
  PulseClass = estream.PulseClass()
  pulse = new PulseClass value.length, false, sendCall, nextStamp(), value, heap, cont
  pulse.propagate sendCall, estream
  undefined


Jolt.sendEvent_drainHighThenNorm = sendEvent_drainHighThenNorm = (estream, value...) ->
  if beforeQ.high.length
    (beforeQ.high.shift())() while beforeQ.high.length
  if beforeQ.norm.length
    (beforeQ.norm.shift())() while beforeQ.norm.length
  sendEvent_nodrain estream, value...
  undefined


Jolt.sendEvent = Jolt.sendEvent_drainAll = Jolt.sendEvent_drainHighThenNormThenMid \
= sendEvent = sendEvent_drainAll = sendEvent_drainHighThenNormThenMid \
= (estream, value...) ->
  if beforeQ.high.length
    (beforeQ.high.shift())() while beforeQ.high.length
  if beforeQ.norm.length
    (beforeQ.norm.shift())() while beforeQ.norm.length
  if beforeQ.mid.length
    (beforeQ.mid.shift())() while beforeQ.mid.length
  sendEvent_nodrain estream, value...
  undefined
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
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
# As a special exception to the GNU GPL, any HTML file or other software
# which merely makes function calls to this software, and for that
# purpose includes it by reference or requires it as a dependency, shall
# be deemed a separate work for copyright law purposes. This special
# exception is not applicable to prototype extensions of or with the
# objects exported by this software, which comprise its API. In
# addition, the copyright holders of this software give you permission
# to combine it with free software libraries that are released under the
# GNU Lesser General Public License (GNU LGPL). You may copy and
# distribute such a system following the terms of the GNU GPL for this
# software and the GNU LGPL for the libraries. If you modify this
# software, you may extend this exception to your version of the
# software, but you are not obligated to do so. If you do not wish to do
# so, delete this exception statement from your version.
#
# If you have executed an End User Software License and Services
# Agreement or an OEM Software License and Support Services Agreement,
# or another commercial license agreement with Projexsys, Inc. (each, a
# "Commercial Agreement"), the terms of the license in such Commercial
# Agreement will supersede the GNU GPL and you may use the Software
# solely pursuant to the terms of the relevant Commercial Agreement.
#
# This sofware is derived from and incorporates existing works. For
# further information and license texts please refer to:
#
# [https://raw.github.com/projexsys/Jolt/master/LICENSES](https://raw.github.com/projexsys/Jolt/master/LICENSES)
