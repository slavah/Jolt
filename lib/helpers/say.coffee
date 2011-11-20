Jolt.say = say = (message, isError, color = 'white') ->
  if not say.okay?
    if not (console? or window?.console?)
      say.okay = -1
      throw 'console.log method is not available'
    console ?= window?.console
    say.console = console
    say.error = console.error?
    if not console.log?
      say.okay = -1
      throw 'console.log method is not available'
    else
      say.okay =  1
      if isNodeJS
        say.clc = require 'cli-color'
      else
        say.clc = {}
        colors = [
          'black'
          'red'
          'green'
          'yellow'
          'blue'
          'magenta'
          'cyan'
          'white'
          'gray'
        ]
        fn = (text) -> text
        (say.clc[c] = fn ; say.clc[c].bold = fn) for c in colors
  if say.okay is -1
    throw 'console.log method is not available'
  if isError and say.error?
    say.console.error (say.clc['red'].bold message)
    return
  say.console.log (say.clc[color] message)


Jolt.sayError = sayError = (message, colors...) ->
