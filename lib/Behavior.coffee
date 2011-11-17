Jolt.isB = isB = (behavior) ->
  behavior instanceof Behavior


class ChangesE extends InternalE

  constructor: (behavior) ->
    super behavior
    name = behavior.name()
    if name
      @_name = name + ' changes'
    else
      @_name = 'absRank ' + behavior.absRank + ' changes'

  # --- #

  ClassName: 'ChangesE'

  @factory: (behavior) ->
    new this behavior

# --- #

changesE = (behavior) ->
  ChangesE.factory behavior


Jolt.Behavior = class Behavior extends EventStream

  constructor: (recvFrom, init...) ->
    super recvFrom
    length = init.length
    @last =
      arity: if not length then (init.push undefined ; length += 1) else length
      value: init

    @_changes = null

  # --- #

  changes: ->
    if not @_changes? then @_changes = changesE(this)
    @_changes

  ClassName: 'Behavior'

  no_null_junc: true

  UPDATER: (pulse) ->

    super

    value = pulse.value
    @last =
      arity: value.length
      value: value

    pulse

  # --- #

  @factory: (args...) ->
    new this args...

# --- #

Jolt.valueNow = valueNow = (behavior) -> behavior.last.value

Behavior::valueNow = (behavior) -> valueNow this

Jolt.$B = Jolt.extractB = $B = extractB = (args...) ->
  Behavior.factory args...

EventStream_api::$B = EventStream_api::extractB = (args...) ->
  extractB this, args...
