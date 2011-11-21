# The `exports` object is in scope per the function wrapper around the entire
# library -- i.e. that wrapper has a parameter named `exports`. In a node.js
# environment, `module.exports` will be passed as the `exports` argument; for
# other environments (e.g. browsers), an object named `this.Jolt` is passed,
# after being created inline. See Jolt's
# [bottom.js](https://raw.github.com/projexsys/Jolt/master/lib/packaging/bottom.js)
# component file.

exporter = (ns = Jolt, target = exports) ->
  for own key, value of ns
    target[key] = ns[key]


# Jolt bundles the [EventEmitter2](https://github.com/hij1nx/EventEmitter2) and
# [Underscore](http://documentcloud.github.com/underscore/) libraries. See
# their respective component files if you wish to understand how they've been
# *slightly* modified to facilitate inline bundling:
# [eventemitter2.mymod.js](https://raw.github.com/projexsys/Jolt/master/lib/helpers/eventemitter2.mymod.js),
# [underscore.mymod.js](https://raw.github.com/projexsys/Jolt/master/lib/helpers/underscore.mymod.js).
# Both are accessible as members of the exported API (e.g. `Jolt._`). Note that
# if `Jolt.globalize()` is called (see the next annotation), both will be placed
# in the global namespace.

Jolt.EventEmitter2 = EventEmitter
Jolt._             = _


# Jolt's `globalize` method provides a convenient means to place the library's
# API in the global namespace. It's never necessary to call it, but for
# Jolt-heavy development and testing, it is useful for reducing verbosity.

Jolt.globalize = (namespaces...) ->
  which = if window? then window else (if global? then global else {})
  if not namespaces.length then exporter(Jolt, which)
  for ns in namespaces
    exporter(ns, which)
  return undefined


exporter()
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
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
