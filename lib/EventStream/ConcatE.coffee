Jolt.ConcatE = class ConcatE extends EventStream_api

  ClassName: 'ConcatE'

  @factory: (args...) ->
    new this args...

  updater: (value...) ->
    [].concat value...

# --- #

Jolt.concatE = concatE = (args...) ->
  ConcatE.factory args...

EventStream_api::concatE = (args...) ->
  concatE (args.push this ; args)...
