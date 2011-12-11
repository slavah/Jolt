Jolt.Pulse_cat = Jolt.Pulse_catch_and_trace \
= Pulse_cat = class Pulse_catch_and_trace extends Pulse

  propagate: (sender, receiver, isHeap, isCatch, isFinally) ->

    HEAP = @heap

    # wrong! not sure how to do this yet...
    traceTime = 123

    if (not isHeap) and (not isCatch) and (not isFinally)

      timeStart = new Date

      stamp = @stamp

      heapP = new @constructor 2, \
      false, \
      sender, \
      stamp, \
      ['start', timeStart], \
      new HeapStore stamp

      heapP.propagate heapP.sender, \
      HEAP_E, \
      true, \
      false, \
      false

    else
      'do'
      # mark the trace time for subtraction purposes

    caught = null

    try
      HEAP = super sender, receiver, isHeap, isCatch, isFinally

    catch error
      caught = error

    finally
      if (not isHeap) and (not isCatch) and (not isFinally)

        timeEnd = new Date

        heapP = new @constructor 5, \
        false, \
        sender, \
        stamp, \
        ['end', timeEnd, (timeEnd - timeStart), traceTime, HEAP], \
        new HeapStore stamp

        heapP.propagate heapP.sender, \
        HEAP_E, \
        true, \
        false, \
        false

      else
        'do'
        # mark the trace time for subtraction purposes

      if caught
        throw caught

    HEAP


  PROPAGATE: (sender, receiver, isHeap, isCatch, isFinally) ->

    caught = false

    PULSE = null

    timeNow = new Date

    fnames = ['tranIN','tranVAL','tranOUT']

    times = {}

    try
      prePulse =
        arity:    @arity
        junction: @junction
        stamp:    @stamp
        value:   (@value.slice 0)

      subs = {}
      subs[fn] = receiver[fn] for fn in fnames

      doSub = (fn) ->
        receiver[fn] = (pulse) ->
          t1 = (new Date).valueOf()
          P = subs[fn].call receiver, pulse
          times[fn] = (new Date).valueOf() - t1
          P
      doSub fn for fn in fnames

      PULSE = receiver.UPDATER this

      if PULSE isnt doNotPropagate and not (isP PULSE)
        PULSE = null
        throw 'receiver\'s UPDATER did not return a pulse object'

    catch error
      if (not isHeap) and (not isCatch) and (not isFinally)
        caught = true
        stamp = @stamp

        errP = new @constructor 5, \
        false, \
        receiver, \
        stamp, \
        [error, prePulse, sender, receiver, timeNow], \
        new HeapStore stamp

        errP.propagate errP.sender, \
        CATCH_E, \
        false, \
        true, \
        false

      else
        throw error

    finally
      receiver[fn] = subs[fn] for fn in fnames

      if (not isHeap) and (not isCatch) and (not isFinally) and (not caught)
        stamp = @stamp

        finP = new @constructor 4, \
        false, \
        receiver, \
        stamp, \
        [prePulse, PULSE, sender, receiver, timeNow, times], \
        new HeapStore stamp

        finP.propagate finP.sender, \
        FINALLY_E, \
        false, \
        false, \
        true

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
      say message, 'green'
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
      say message, 'blue'
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

  sayError message, 'bright', 'red'
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
    tranIN:  #{times.tranIN}
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
# As a special exception to the GNU GPL, any HTML file or other software
# which merely makes function calls to this software, and for that
# purpose includes it by reference or requires it as a dependency, shall
# be deemed a separate work for copyright law purposes. This special
# exception is not applicable to prototype extensions of or with the
# objects exported by this software, which comprise its API. In
# addition, the copyright holders of this software give you permission
# to combine it with free software libraries that are released under the
# GNU LESSER GENERAL PUBLIC LICENSE (GNU LGPL). You may copy and
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
# https://raw.github.com/projexsys/Jolt/master/LICENSES
