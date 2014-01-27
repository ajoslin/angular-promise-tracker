/*
 * promise-tracker - v2.0.0-beta2 - 2014-01-27
 * http://github.com/ajoslin/angular-promise-tracker
 * Created by Andy Joslin; Licensed under Public Domain
 */

(function() {
angular.module('ajoslin.promise-tracker', []);


angular.module('ajoslin.promise-tracker')
.config(['$httpProvider', function($httpProvider) {
  $httpProvider.interceptors.push(TrackerHttpInterceptor);
}]);

//angular-1.0.x format
function TrackerHttpInterceptor($q, promiseTracker) {
  return {
    request: function(config) {
      if (config.tracker) {
        if (!angular.isArray(config.tracker)) {
          config.tracker = [config.tracker];
        }
        config.$promiseTrackerDeferred = config.$promiseTrackerDeferred || [];

        angular.forEach(config.tracker, function(trackerName) {
          var deferred = promiseTracker(trackerName).createPromise(config);
          config.$promiseTrackerDeferred.push(deferred);
        });
      }
      return $q.when(config);
    },
    response: function(response) {
      if (response.config && response.config.$promiseTrackerDeferred) {
        angular.forEach(response.config.$promiseTrackerDeferred, function(deferred) {
          deferred.resolve(response);
        });
      }
      return $q.when(response);
    },
    responseError: function(response) {
      if (response.config && response.config.$promiseTrackerDeferred) {
        angular.forEach(response.config.$promiseTrackerDeferred, function(deferred) {
          deferred.reject(response);
        });
      }
      return $q.reject(response);
    }
  };
}
TrackerHttpInterceptor.$inject = ['$q', 'promiseTracker'];



angular.module('ajoslin.promise-tracker')

.provider('promiseTracker', function() {
  var trackers = {};


  this.$get = ['$q', '$timeout', function($q, $timeout) {
    function cancelTimeout(promise) {
      if (promise) {
        $timeout.cancel(promise);
      }
    }

    function promiseTracker(id) {
      if (!trackers[id]) {
        throw new Error('Tracker with id "' + id + '" does not exist! Use promiseTracker.register()');
      }
      return trackers[id];
    }

    promiseTracker.register = function(id, options) {
      if (trackers[id]) {
        throw new Error('Tracker with id "' + id + '" already exists!');
      }
      trackers[id] = new Tracker(options);
      return trackers[id];
    };

    promiseTracker.deregister = function(id) {
      if (trackers[id]) {
        trackers[id]._destroy();
        delete trackers[id];
      }
    };

    return promiseTracker;

    function Tracker(options) {
      options = options || {};

      //Array of promises being tracked
      var tracked = [];
      var self = this;

      //Allow an optional "minimum duration" that the tracker has to stay active for.
      var minDuration = options.minDuration;
      //Allow an option "maximum amount of time" that the tracker can stay active.
      var maxDuration = options.maxDuration;
      //Allow a delay that will stop the tracker from activating until that time is reached
      var activationDelay = options.activationDelay;

      var minDurationPromise;
      var maxDurationPromise;
      var activationDelayPromise;

      self._destroy = function() {
        minDurationPromise = cancelTimeout(minDurationPromise);
        maxDurationPromise = cancelTimeout(maxDurationPromise);
        activationDelayPromise = cancelTimeout(activationDelayPromise);
        self.cancel();
      };

      self.active = function() {
        //Even if we have a promise in our tracker, we aren't active until delay is elapsed
        if (activationDelayPromise) {
          return false;
        }
        return tracked.length > 0;
      };

      self.cancel = function() {
        //Resolve backwards because we splice the tracked array every time resolve is called
        for (var i=tracked.length - 1; i>=0; i--) {
          tracked[i].resolve();
        }
      };

      //Create a promise that will make our tracker active until it is resolved.
      //@return deferred - our deferred object that is being tracked
      self.createPromise = function() {
        var deferred = $q.defer();
        tracked.push(deferred);

        //If the tracker was just inactive and this the first in the list of
        //promises, we reset our 'minimum duration' and 'maximum duration'
        //again.
        if (tracked.length === 1) {
          if (activationDelay) {
            activationDelayPromise = $timeout(function() {
              activationDelayPromise = cancelTimeout(activationDelayPromise);
              startMinMaxDuration();
            }, activationDelay);
          } else {
            startMinMaxDuration();
          }
        }

        deferred.promise.then(onDone(false), onDone(true));

        return deferred;

        function startMinMaxDuration() {
          if (minDuration) {
            minDurationPromise = $timeout(angular.noop, minDuration);
          }
          if (maxDuration) {
            maxDurationPromise = $timeout(deferred.resolve, maxDuration);
          }
        }

        //Create a callback for when this promise is done. It will remove our
        //tracked promise from the array if once minDuration is complete
        function onDone(isError) {
          return function(value) {
            (minDurationPromise || $q.when()).then(function() {
              var index = tracked.indexOf(deferred);
              tracked.splice(index, 1);

              //If this is the last promise, cleanup the timeouts
              //for maxDuration and activationDelay
              if (tracked.length === 0) {
                maxDurationPromise = cancelTimeout(maxDurationPromise);
                activationDelayPromise = cancelTimeout(activationDelayPromise);
              }
            });
          };
        }
      };

      self.addPromise = function(promise) {
        var then = promise && (promise.then || promise.$then ||
                               (promise.$promise && promise.$promise.then));
        if (!then) {
          throw new Error("promiseTracker#addPromise expects a promise object!");
        }
        var deferred = self.createPromise();

        //When given promise is done, resolve our created promise
        //Allow $then for angular-resource objects
        then(function success(value) {
          deferred.resolve(value);
          return value;
        }, function error(value) {
          deferred.reject(value);
          return $q.reject(value);
        });

        return deferred;
      };
    }
  }];
});

}());