# Jolt's `say` and `sayError` methods are intended as convenient,
# cross-platform abstractions on top of `console.log`, and `console.error` if it
# exists in a given environment. Both support colorized terminal output in a
# node.js runtime by way of the
# [cli-color](https://github.com/medikoo/cli-color) package.

_say = (message, isError, styles...) ->
  if not _say.okay?
    if not (console? or window?.console?)
      _say.okay = -1
      throw clog_err
    console ?= window?.console
    _say.console = console
    _say.error = console.error?
  if not console.log?
      _say.okay = -1
      throw clog_err
    else
      _say.okay =  1
  if _say.okay is -1
    throw clog_err
  if not isNodeJS
    _say_helper message, isError
  else
    switch styles.length
      when 0
        message = message
      when 1
        message = _say.clc[styles[0]] message
      when 2
        message = _say.clc[styles[0]][styles[1]] message
      when 3
        message = _say.clc[styles[0]][styles[1]][styles[2]] message
      else
        message = _say.clc[styles[0]][styles[1]][styles[2]][styles[3]] message
    _say_helper message, isError


if isNodeJS
  _say.clc = require 'cli-color'


clog_err = 'Jolt.say: console.log method is not available'


_say_helper = (message, isError) ->
  if isError
    if _say.error?
      _say.console.error message
      return
  _say.console.log message


Jolt.say = say = (message, styles...) ->
  _say message, false, styles...


Jolt.sayError = Jolt.sayErr = sayError = sayErr = (message, styles...) ->
  _say message, true, styles...
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
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