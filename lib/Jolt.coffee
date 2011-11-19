isNodeJS = Boolean process?.pid

Jolt = {}


Jolt.$$ = $$ = (args...) ->
  if not $$.okay?
    if Sizzle?
      $$.okay =  1
    else
      $$.okay = -1
  if $$.okay is -1
    throw 'Jolt.$$: Sizzle is undefined, because the document object was undefined when Jolt was loaded'
  Sizzle args...


Jolt.say = say = (message, isError, color = 'white') ->
  if not say.okay?
    if not (console? or window?.console?)
      say.okay = -1
      throw 'console.log method is not available'
    console ?= window?.console
    say.console = console
    say.error = console.error?
    if not console.log?
      say.okay = -1
      throw 'console.log method is not available'
    else
      say.okay =  1
      if isNodeJS
        say.clc = require 'cli-color'
      else
        say.clc = {}
        colors = [
          'black'
          'red'
          'green'
          'yellow'
          'blue'
          'magenta'
          'cyan'
          'white'
          'gray'
        ]
        fn = (text) -> text
        (say.clc[c] = fn ; say.clc[c].bold = fn) for c in colors
  if say.okay is -1
    throw 'console.log method is not available'
  if isError and say.error?
    say.console.error (say.clc['red'].bold message)
    return
  say.console.log (say.clc[color] message)
#
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
# PARTICULAR PURPOSE. See the GNU GPL for more details.
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
