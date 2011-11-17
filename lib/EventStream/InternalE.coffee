Jolt.InternalE = class InternalE extends EventStream_api

  ClassName: 'InternalE'

  @factory: (args...) ->
    new this args...

# --- #

Jolt.internalE = internalE = (args...) ->
  InternalE.factory args...

EventStream_api::internalE = (args...) ->
  internalE args..., this
