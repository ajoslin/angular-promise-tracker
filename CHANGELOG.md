<a name="2.0.0-beta1"></a>
### 2.0.0-beta1 (2014-01-27)


#### Features

* **promiseTracker:**
  * remove events system ([d3770aac](http://github.com/ajoslin/angular-promise-tracker/commit/d3770aacbd1d1233dcf3f894982004939e64bf91))
  * add register() and deregister() methods ([cab3c620](http://github.com/ajoslin/angular-promise-tracker/commit/cab3c62013ed3dcb9a0b47d9d1d5ae17d2fe6ab4))


#### Breaking Changes

* The events system has been removed.  That means that `promiseTracker.on()`
and `promiseTracker.off()` no longer exist. In essence, events were a poor way of doing
'hooks' on promises that we wanted to do.  See [this
issue](https://github.com/ajoslin/angular-promise-tracker/issues/37) for
more information.

  [Open an
  issue of your own](https://github.com/ajoslin/angular-promise-tracker/issues) if you
  were using events and need help migrating to use another method.

  Check [the
  README](https://github.com/ajoslin/angular-promise-tracker/tree/master/README.md)
  for details on the current API for promiseTracker.
   ([d3770aac](http://github.com/ajoslin/angular-promise-tracker/commit/d3770aacbd1d1233dcf3f894982004939e64bf91))

* A promiseTracker instance can no longer be created with the
`promiseTracker` function, it is a getter only now.  Use 
`promiseTracker.register()`.

  To migrate your code, change the following:

  ```js
  var newTracker = promiseTracker('newTracker', options);
  //..later
  var tracker = promiseTracker('newTracker');
  ```

  To:

  ```js
  var newTracker = promiseTracker.register('newTracker', options);
  //..later
  var tracker = promiseTracker('newTracker');
  ```

  Check the [project
  README](http://github.com/ajoslin/angular-promise-tracker/tree/master/README.md)
  for more details about this change.
   ([cab3c620](http://github.com/ajoslin/angular-promise-tracker/commit/cab3c62013ed3dcb9a0b47d9d1d5ae17d2fe6ab4))


<a name="v1.5.1"></a>
### v1.5.1 (2014-01-04)

#### Features

* **promiseTracker:** add `activationDelay` option (see documentation in README.md)

<a name="v1.5.0"></a>
## v1.5.0 (2013-12-23)

#### Features

* support angular-1.2 ngResource)

#### Breaking Changes

* Note: Use of angular-1.0.x and angular-1.1.x are now deprecated.  They will be removed in the next version.

# 1.4.2 (2013-10-22)

## Bug fixes
### gruntfile

* fix closure problem ([437b4623](http://github.com/ajoslin/angular-promise-tracker/commits/437b4623))




# 1.4.1 (2013-10-21)



## Bug fixes
### interceptor

* fix error in ie8 ([92d72f2c](http://github.com/ajoslin/angular-promise-tracker/commits/92d72f2c))




# 1.4.0 (2013-10-09)

## Features
### interceptor

* allow array of tracker names in http tracker option ([66d41cdd](http://github.com/ajoslin/angular-promise-tracker/commits/66d41cdd))






# 1.3.3 (2013-04-29)

## Bug fixes
### promise-tracker

* Fix error with minified files (f8ee34e8)
# 1.3.0 (2013-04-25)


## Features
### conventional-changelog

* Introduce grunt-conventional-changelog (f8b7d23)




# Version 1.2 (Apr 25, 2013)

## Features

**Change name of module to `ajoslin.promise-tracker`**

  - Follows [AngularJS component spec](http://github.com/angular/angular-component-spec).
  - To migrate, just change the name of the module included. For example: `angular.module('myApp', ['ajoslin.promise-tracker']);`

**Add support for angular-resource**

  ```js
  var Books = new $resource('/books');
  var bookList = Books.get();
  myTracker.addPromise(bookList);
  ```
  - See more examples in the [promiseTracker angular-resource tests](http://github.com/ajoslin/angular-promise-tracker/tree/master/test/unit/resource.spec.js).


# Version 1.1 (Apr 9, 2013)

## Features

**Add `cancel` method for a tracker**

  - When called, `myTracker.cancel()` will immediately turn the tracker inactive and fire all events.

**Add a concept of options for trackers**

  - Options can be set when the tracker is first created:

    `var myTracker = promiseTracker('super_track', { stressLevel: 0 });`

  - All options also have setters:

    `myTracker.setStressLevel(0);`

**Add `minDuration` option**

  - Passed in with `minDuration` key in options, or set with `setMinDuration` method on a tracker.
  - Makes it so when a tracker is activated, it will always stay up for at least the given milliseconds.
  - For example, if I set minDuration to 1000 and give my tracker three promises that all resolve after 850ms, the tracker will stay active until 1000ms have expired.

**Add `maxDuration` option**

  - Passed in with `maxDuration` key in options, or set with `setMaxDuration` method on a tracker.
  - Makes it so a tracker will automatically deactivate itself after the given milliseconds of being active.
  - For example, if I set maxDuration to 5000, no matter how long the promises I give my tracker wait to be resolved, the tracker will deactivate after 5000ms have expired.
