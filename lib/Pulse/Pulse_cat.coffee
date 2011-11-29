Jolt.Pulse_cat = Jolt.Pulse_catch_and_trace \
= Pulse_cat = class Pulse_catch_and_trace extends Pulse

  propagate: (pulse, sender, receiver, high, isHeap, isCatch, isFinally) ->

    HEAP = pulse.heap

    # wrong! not sure how to do this yet...
    traceTime = 123

    if (not isHeap) and (not isCatch) and (not isFinally)

      timeStart = new Date

      stamp = pulse.stamp

      heapP = new Pulse_cat 2, \
      false, \
      sender, \
      stamp, \
      ['start', timeStart], \
      new HeapStore stamp

      @constructor.prototype.propagate heapP, \
      heapP.sender, \
      HEAP_E, \
      true, \
      true, \
      false, \
      false

      setPropagating true

    else
      'do'
      # mark the trace time for subtraction purposes

    caught = null

    try
      HEAP = super pulse, sender, receiver, high, isHeap, isCatch, isFinally

    catch error
      caught = error

    finally
      if (not isHeap) and (not isCatch) and (not isFinally)

        timeEnd = new Date

        heapP = new Pulse_cat 5, \
        false, \
        sender, \
        stamp, \
        ['end', timeEnd, (timeEnd - timeStart), traceTime, HEAP], \
        new HeapStore stamp

        @constructor.prototype.propagate heapP, \
        heapP.sender, \
        HEAP_E, \
        true, \
        true, \
        false, \
        false

      else
        'do'
        # mark the trace time for subtraction purposes

      if caught
        throw caught

    HEAP


  PROPAGATE: (pulse, sender, receiver, high, isHeap, isCatch, isFinally) ->

    caught = false

    PULSE = null

    timeNow = new Date

    fnames = ['tranRCV','tranVAL','tranOUT']

    times = {}

    try
      prePulse =
        arity:    pulse.arity
        junction: pulse.junction
        stamp:    pulse.stamp
        value:   (pulse.value.slice 0)

      subs = {}
      subs[fn] = receiver[fn] for fn in fnames

      doSub = (fn) ->
        receiver[fn] = (pulse) ->
          t1 = (new Date).valueOf()
          P = subs[fn].call receiver, pulse
          times[fn] = (new Date).valueOf() - t1
          P
      doSub fn for fn in fnames

      PULSE = receiver.UPDATER pulse

      if PULSE isnt doNotPropagate and not (isP PULSE)
        PULSE = null
        throw 'receiver\'s UPDATER did not return a pulse object'

    catch error
      if (not isHeap) and (not isCatch) and (not isFinally)
        caught = true
        stamp = pulse.stamp

        errP = new Pulse_cat 5, \
        false, \
        receiver, \
        stamp, \
        [error, prePulse, sender, receiver, timeNow], \
        new HeapStore stamp

        @constructor.prototype.propagate errP, \
        errP.sender, \
        CATCH_E, \
        true, \
        false, \
        true, \
        false

        setPropagating true

      else
        setPropagating false
        throw error

    finally
      receiver[fn] = subs[fn] for fn in fnames

      if (not isHeap) and (not isCatch) and (not isFinally) and (not caught)
        stamp = pulse.stamp

        finP = new Pulse_cat 4, \
        false, \
        receiver, \
        stamp, \
        [prePulse, PULSE, sender, receiver, timeNow, times], \
        new HeapStore stamp

        @constructor.prototype.propagate finP, \
        finP.sender, \
        FINALLY_E, \
        true, \
        false, \
        false, \
        true

        setPropagating true

    PULSE ?= doNotPropagate


Jolt.HEAP_E = HEAP_E = internalE().name('Jolt.HEAP_E').PulseClass Pulse_cat

Jolt.CATCH_E = CATCH_E = internalE().name('Jolt.CATCH_E').PulseClass Pulse_cat

Jolt.FINALLY_E = FINALLY_E = internalE().name('Jolt.FINALLY_E').PulseClass Pulse_cat


Jolt.defaultHeapE = defaultHeapE = HEAP_E.mapE((where, timeNow, timeElapsed, traceTime, HEAP) ->
  switch where
    when 'start'
      message = """
        ----HEAP-START----
        #{timeNow}
        epoch: #{timeNow.valueOf()}
      """
      say message, false, 'green'
    when 'end'
      message = """
        ----HEAP-END-----
        #{timeNow}
        epoch:   #{timeNow.valueOf()}
          (time in ms)
        elapsed:  #{timeElapsed}
        trace:    #{0}
        est. net: #{0}
      """
      say message, false, 'blue'
).name('Jolt.defaultHeapE').PulseClass Pulse_cat


Jolt.defaultCatchE = defaultCatchE = CATCH_E.mapE((error, prePulse, sender, receiver, timeNow) ->
  if (typeof error) is 'string'
    emsg = error
  else if error.message?
    emsg = error.message
  else
    emsg = JSON.stringify error
  if emsg is '' then emsg = 'undefined'
  emsg ?= 'undefined'

  sName = sender.name()
  sName ?= 'unnamed'
  sClass = '(' + sender.ClassName + ')'
  if sClass is '(undefined)' then sClass = ''

  rName = receiver.name()
  rName ?= 'unnamed'
  rClass = '(' + receiver.ClassName + ')'

  message = """
    ------ERROR------
    sender:    #{sName}  #{sClass}
      rank:    #{sender.rank or 'n/a'}
      absRank: #{sender.absRank or 'n/a'}
    receiver:  #{rName}  #{rClass}
      mode:    #{receiver.mode()}
      nary:    #{receiver.isNary()}
      rank:    #{receiver.rank}
      absRank: #{receiver.absRank}
    error:     #{emsg}
    ----RECV-PULSE---
    arity:     #{prePulse.arity}
    junction:  #{prePulse.junction}
    stamp:     #{prePulse.stamp}
    value:     #{JSON.stringify prePulse.value}
  """

  say message, true
).name('Jolt.defaultCatchE').PulseClass Pulse_cat


Jolt.defaultFinallyE = defaultFinallyE = FINALLY_E.mapE((prePulse, PULSE, sender, receiver, timeNow, times) ->
  sName = sender.name()
  sName ?= 'unnamed'
  sClass = '(' + sender.ClassName + ')'
  if sClass is '(undefined)' then sClass = ''

  rName = receiver.name()
  rName ?= 'unnamed'
  rClass = '(' + receiver.ClassName + ')'

  message = """
    ------TRACE------
    sender:    #{sName}  #{sClass}
      rank:    #{sender.rank or 'n/a'}
      absRank: #{sender.absRank or 'n/a'}
    receiver:  #{rName}  #{rClass}
      mode:    #{receiver.mode()}
      nary:    #{receiver.isNary()}
      rank:    #{receiver.rank}
      absRank: #{receiver.absRank}
    ----RCV-PULSE----
    arity:     #{prePulse.arity}
    junction:  #{prePulse.junction}
    stamp:     #{prePulse.stamp}
    value:     #{JSON.stringify prePulse.value}
    ----OUT-PULSE----
    arity:     #{PULSE.arity}
    junction:  #{PULSE.junction}
    stamp:     #{PULSE.stamp}
    value:     #{JSON.stringify PULSE.value}
    -----PROFILE-----
      (time in ms)
    tranRCV: #{times.tranRCV}
    tranVAL: #{times.tranVAL}
    tranOUT: #{times.tranOUT}
  """

  say message
).name('Jolt.defaultFinallyE').PulseClass Pulse_cat
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
# <<<>>>
#
# Jolt - Reactive Objects for JavaScript
#
# https://github.com/projexsys/Jolt
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
# https://raw.github.com/projexsys/Jolt/master/LICENSE
# http://www.gnu.org/licenses/gpl-3.0.txt
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
# https://raw.github.com/projexsys/Jolt/master/LICENSES
