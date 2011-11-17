Jolt.MappedE = class MappedE extends EventStream_api

  constructor: (@fn, args...) ->
    super args...

  # --- #

  ClassName: 'MappedE'

  @factory: (fn, args...) ->
    if not (_.isFunction fn)
      throw '<' + @prototype.ClassName + '>.factory: 1st argument must be a function'
    new this fn, args...

  updater: (value...) ->
    fn = @fn
    [ (fn value...) ]

# --- #

Jolt.mapE = mapE = (args...) ->
  MappedE.factory args...

EventStream_api::mapE = (args...) ->
  mapE (args.push this ; args)...
