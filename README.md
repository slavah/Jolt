Name
====

Jolt - Reactive Objects for JavaScript. [![Build Status](https://secure.travis-ci.org/projexsys/Jolt.png)](http://travis-ci.org/projexsys/Jolt)

Please Note
===========

This README is barely a work in progress.

Description
===========

`Jolt` is a JavaScript library with two related goals. First, it will re-implement the [Flapjax](http://www.flapjax-lang.org/) library in a generalized variadic form, and in terms of [CoffeeScript](http://jashkenas.github.com/coffee-script/) components -- easing development and testing, while providing essentially the [same API](http://www.flapjax-lang.org/docs/). Support for "compiled" Flapjax will be dropped, i.e. access to the Functional Reactive facilities will involve explicit calls to Jolt's API.

Second, Jolt will provide an extensible [class](http://jashkenas.github.com/coffee-script/#classes) termed `Reactor`, allowing reactive application components to be built in a highly reusable fashion.

Currently, the plan is to split the original library into two modules:

1. The main module will implement Jolt's `EventStream`, `Behavior` and the `Reactor` classes (and derived classes), without any reference to the DOM.
2. A second module will incorporate the main one and provide reactive DOM facilities.

Building a "reactive UI" library on top will be an obvious next step, and `Jolt` should ease too the building of complex, asynchronous libraries for high-level network protocol implementations, database connectivity, DOM simulation, and so on.

Bugs
====

All complex software has bugs lurking in it, and this module is no exception.

Please report any bugs through the web interface at <https://github.com/projexsys/Jolt/issues>


Authors
=======

Michael Bradley, Jr. <michaelsbradleyjr@gmail.com>


Copyright and License
=====================

This software is Copyright (c) 2011 by Projexsys, Inc.

This is free software, licensed under:

The GNU General Public License Version 3

The JavaScript and CoffeeScript code developed and owned by Projexsys, Inc. in this distribution is free software: you can redistribute it and/or modify it under the terms of the GNU General Public License (GNU GPL) as published by the Free Software Foundation, either version 3 of the License, or (at your option) any later version. The code is distributed WITHOUT ANY WARRANTY; without even the implied warranty of MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE. See the GNU GPL for more details:

https://raw.github.com/projexsys/Jolt/master/LICENSE<br />
http://www.gnu.org/licenses/gpl-3.0.txt

As a special exception to the GNU GPL, any HTML file or other software which merely makes function calls to this software, and for that purpose includes it by reference or requires it as a dependency, shall be deemed a separate work for copyright law purposes. This special exception is not applicable to prototype extensions of or with the objects exported by this software, which comprise its API. In addition, the copyright holders of this software give you permission to combine it with free software libraries that are released under the Lesser General Public License (GNU LGPL). You may copy and distribute such a system following the terms of the GNU GPL for this software and the GNU LGPL for the libraries. If you modify this software, you may extend this exception to your version of the software, but you are not obligated to do so. If you do not wish to do so, delete this exception statement from your version.

If you have executed an End User Software License and Services Agreement or an OEM Software License and Support Services Agreement, or another commercial license agreement with Projexsys, Inc. (each, a "Commercial Agreement"), the terms of the license in such Commercial Agreement will supersede the GNU GPL and you may use the Software solely pursuant to the terms of the relevant Commercial Agreement.

This software is derived from and incorporates existing works. For further information and license texts please refer to:<br />
https://raw.github.com/projexsys/Jolt/master/LICENSES

---------------------------------------

<a href="https://developer.mozilla.org/en/JavaScript/Reference/" title="JavaScript Reference">
  <img src="http://static.jsconf.us/promotejshs.png" alt="JavaScript Reference" />
</a>
