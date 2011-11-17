Jolt.PriorityQueue = class PriorityQueue extends BinaryHeap
  constructor: ->
    @content = []

  scoreFunction: (x) -> x.rank
