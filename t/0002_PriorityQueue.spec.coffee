isNodeJS = Boolean process?.pid

if isNodeJS
  path = require 'path'
  Jolt = require path.normalize process.cwd() + '/../index'

describe 'Jolt.PriorityQueue', ->

  it '''
    should sort queue members by their 'rank' properties (integers) whenever
    its 'push' and 'pop' methods are called
  ''', ->

    PQ = new Jolt.PriorityQueue

    tests = [
      { rank: 28     }
      { rank: 1002   }
      { rank: 26     }
      { rank: 100000 }
      { rank: 3333   }
    ]

    PQ.push test for test in tests

    coll = (PQ.pop() while PQ.size())

    ( expect coll ).toEqual [
      { rank: 26     }
      { rank: 28     }
      { rank: 1002   }
      { rank: 3333   }
      { rank: 100000 }
    ]
