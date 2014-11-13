<a name="2.1.0"></a>
## 2.1.0 (2014-11-13)


#### Features

* **promiseTracker:** upgrade to angular 1.3 ([faf1eb01](http://github.com/ajoslin/angular-promise-tracker/commit/faf1eb01e9ebfd5fe03f4683748a45498d5692e4))


<a name="2.0.1"></a>
### 2.0.1 (2014-04-11)


#### Bug Fixes

* **ie10-:** stop error from bad spacing in comments ([8a1f2c3d](http://github.com/ajoslin/angular-promise-tracker/commit/8a1f2c3dfbebc1477e0341e334f468a8b9325a3b), closes [#42](http://github.com/ajoslin/angular-promise-tracker/issues/42))


#### Features

* **promiseTracker:** add tracker.tracking() method ([87776e54](http://github.com/ajoslin/angular-promise-tracker/commit/87776e549c52b8ee446e53b3830893949d9aa451))


<a name="2.0.0"></a>
### 2.0.0 (2014-01-27)

**The API has completely changed in 2.0. See the README for details. Synopsis of changes:**

* String ID system for trackers removed, now use instances created with `var myTrack = new promiseTracker(options);`.
* http interceptor functionality is now optional; use it by including `promise-tracker-http-interceptor.js`
* maxDuration option is removed (there are better ways to do this in every case)

If you are using 1.x in your app and you would like to upgrade, here is the migration guide:

* Find your string ids where you are getting promiseTracker with `promiseTracker('id')`, and create a reference instead with `promiseTracker()`.  If you want a global tracker, store it on rootScope or in a service (check README).
* (note: The actual instances of the promiseTrackers will have the same API).

Upgrading is *not* required, or even recommended, for existing apps.


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
