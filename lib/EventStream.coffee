lastRank = 0
nextRank = -> ++lastRank


Jolt.isE = isE = (estream) ->
  estream instanceof EventStream


genericAttachListener = (sender, receiver) ->
  if not isPropagating
    if sender.rank is receiver.rank
      throw '<' + sender.ClassName + '>.attachListener: cycle detected in propagation graph'
    i = _.indexOf sender.sendTo, receiver
    if not (i + 1)
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
    scheduleBefore beforeQ, genericAttachListener, sender, receiver


genericRemoveListener = (sender, receiver) ->
  if not isPropagating
    i = _.indexOf sender.sendTo, receiver
    if (i + 1) then sender.sendTo.splice i, 1
  else
    scheduleBefore beforeQ, genericRemoveListener, sender, receiver


genericRemoveWeakReference = (sender, weakReference) ->
  weakReference.cleanupScheduled = false
  if not weakReference.cleanupCanceled
    if not isPropagating
      i = _.indexOf sender.sendTo, weakReference
      if (i + 1) then sender.sendTo.splice i, 1
      if not sender.sendTo.length then sender.weaklyHeld = true
    else
      scheduleCleanup cleanupQ, sender, weakReference
  else
    weakReference.cleanupCanceled = null


Jolt.EventStream = class EventStream

  constructor: (recvFrom...) ->

    @rank = nextRank()
    @absRank = @rank

    @sendTo = []

    if recvFrom.length
      _( _.flatten [ recvFrom... ] ).map (estream) =>
        estream.attachListener this

  # --- #

  attachListener: (receiver) ->
    if not isE receiver
      throw '<' + @ClassName + '>.attachListener: expected an EventStream'
    genericAttachListener this, receiver
    this

  removeListener: (receiver) ->
    if not isE receiver
      throw '<' + @ClassName + '>.removeListener: expected an EventStream'
    genericRemoveListener this, receiver
    this

  removeWeakReference: (weakReference) ->
    if not isE weakReference
      throw '<' + @ClassName + '>.removeWeakReference: expected an EventStream'
    genericRemoveWeakReference this, weakReference
    this

  ClassName: 'EventStream'

  cleanupCanceled: null

  cleanupScheduled: false

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
    thisClass = this
    ret = []
    _( pulse.value )
    .each((jp) ->
      if jp.junction
        ret = ret.concat (thisClass.seq_junc_helper jp)
      else
        ret = ret.concat jp.value)
    ret

  vec_junc_helper: (pulse) ->
    thisClass = this
    ret = []
    _( pulse.value )
    .each((jp) ->
      if jp.junction
        ret = ret.concat (thisClass.vec_junc_helper jp)
      else
        ret.push jp.value)
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
          pulse.value = _( pulse.value ).zip()
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
      _( pulse.value )
      .each((val) ->
        ret = ret.concat val)
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
        _( pulse.value )
        .each((value) ->
          iret = thisClass.updater value...
          if iret isnt doNotPropagate
            ret.push iret)
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

# --- #

Jolt.sendEvent = sendEvent = (estream, vals...) ->
  high = false
  high_maybe = vals[vals.length - 1]
  if high_maybe is propagateHigh
    high = true
    vals.pop()
  pClass = estream.PulseClass()
  length = vals.length
  P = new pClass length, false, sendCall, nextStamp(), vals
  pClass.prototype.propagate P, P.sender, estream, high
  undefined
