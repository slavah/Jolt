Jolt.ReceiverE = class ReceiverE extends EventStream_api

  ClassName: 'ReceiverE'

  @factory: ->
    new this

  sendEvent: (value...) ->
    sendEvent this, value...


Jolt.receiverE = receiverE = ->
  ReceiverE.factory()
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
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

