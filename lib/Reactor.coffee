# need to bundle an ever so slightly modified EventEmitter2 source
# use same trick as for underscore re: exporting and globalizing

Jolt.Reactor = class Reactor extends EventEmitter

# also want to do an include/extend for class properties
# the above "extends" handles instances only
