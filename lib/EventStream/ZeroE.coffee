Jolt.ZeroE = class ZeroE extends EventStream_api

  ClassName: 'ZeroE'

  UPDATER: (pulse) ->
    throw '<' + @ClassName + '>.UPDATER: received a pulse; an instance of ' + @ClassName + ' should never receive a pulse'


Jolt.zeroE = zeroE = (args...) ->
  ZeroE.factory args...

EventStream_api::zeroE = (args...) ->
  zeroE (args.push this ; args)...
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
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
# [https://raw.github.com/projexsys/Jolt/master/LICENSES](https://raw.github.com/projexsys/Jolt/master/LICENSES)
