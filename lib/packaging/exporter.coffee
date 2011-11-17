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
