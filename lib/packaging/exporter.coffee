exporter = (ns = Jolt, target = exports) ->
  for own key, value of ns
    target[key] = ns[key]


Jolt._  = _
Jolt._s = _s
Jolt.EventEmitter2 = EventEmitter


# manual calls to globalize would be superfluous for browser envs given
# top/bottom wrapper implementation and the call to exporter at the end
# of this script
Jolt.globalize = (namespaces...) ->
  which = if window? then window else (if global? then global else {})
  if not namespaces.length then exporter(Jolt, which)
  for ns in namespaces
    exporter(ns, which)
  return undefined


# :: modulize ::
#
#  hackery to allow "globalization" of a namespace within a module's
#  scope but without leaking to the top-level scope in the manner of
#  Jolt.globalize()
#
# for own key, value of namespace
#   eval("var #{key} = namespace.#{key}")


exporter()
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
