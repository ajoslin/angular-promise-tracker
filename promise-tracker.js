/*
 * angular-promise-tracker
 * http://github.com/ajoslin/angular-promise-tracker
 * All copyright waived with CC-0 license
 */

angular.module('promiseTracker', [])

.provider('promiseTracker', function() {
  var trackers = {};

  this.$get = ['$q', '$timeout', function($q, $timeout) {
    var self = this;

    function Tracker(options) {
      options = options || {};
      var self = this,
        //Define our callback types.  The user can catch when a promise starts,
        //has an error, is successful, or just is done with error or success.
        callbacks = {
          start: [], //Start is called when a new promise is added
          done: [], //Called when a promise is resolved (error or success)
          error: [], //Called on error.
          success: [] //Called on success.
        },
        trackedPromises = [];

      //Allow an optional "minimum duration" that the tracker has to stay
      //active for. For example, if minimum duration is 1000ms and the user 
      //adds three promises that all resolve after 650ms, the tracker will 
      //still count itself as active until 1000ms have passed.
      self.setMinDuration = function(minimum) {
        self._minDuration = minimum;
      };
      self.setMinDuration(options.minDuration);

      //## active()
      //Returns whether the promiseTracker is active - detect if we're 
      //currently tracking any promises.
      self.active = function() {
        return trackedPromises.length > 0;
      };

      //## cancel()
      //Resolves all the current promises, immediately ending the tracker.
      self.cancel = function() {
        angular.forEach(trackedPromises, function(deferred) {
          deferred.resolve();
        });
      };

      function fireEvent(event, params) {
        angular.forEach(callbacks[event], function(cb) {
          cb.apply(self, params || []);
        });
      }
      function minDuration() {
        return $timeout(options.minDuration);
      }

      //## addPromise()
      //Adds a promise to our tracking.
      self.addPromise = function(promise) {
        //We create our own promise to track instead of piggybacking on the 
        //given promise.  This lets us do things like cancel early or add 
        //a minimum duration.
        var deferred = $q.defer(),
          //All arguments after the promise count as args to our 'start' event.
          startArgs = [].slice.call(arguments, 1);

        trackedPromises.push(deferred);
        fireEvent('start', startArgs);

        //If the tracker was just inactive and this the first in the list of
        //promises, we reset our 'minimum duration' again.
        if (trackedPromises.length == 1) {
          if (self._minDuration) {
            self.waitPromise = $timeout(angular.noop, self._minDuration);
          } else {
            self.waitPromise = $q.when(true);
          }
        }
        deferred.promise.then(onDone(false), onDone(true));

        //Create a callback for when this promise is done. It will remove our
        //tracked promise from the array and call the appropriate event 
        //callbacks depending on whether there was an error or not.
        function onDone(isError) {
          return function(value) {
            //Before resolving our promise, make sure the minDuration timeout
            //has finished.
            self.waitPromise.then(function() {
              fireEvent('done', [value, isError]);
              fireEvent(isError ? 'error' : 'success', [value]);
              var index = trackedPromises.indexOf(deferred);
              trackedPromises.splice(index, 1);
            });
          };
        }

        promise.then(function success(value) {
          deferred.resolve(value);
          return value;
        }, function error(value) {
          deferred.reject(value);
          return $q.reject(value);
        });

        return self;
      };

      //## on(), bind()
      self.on = self.bind = function(event, cb) {
        if (!callbacks[event]) {
          throw "Cannot create callback for event '" + event + 
          "'. Allowed types: 'start', 'done', 'error', 'success'";
        }
        callbacks[event].push(cb);
        return self;
      };
      self.off = self.unbind = function(event, cb) {
        if (!callbacks[event]) {
          throw "Cannot create callback for event '" + event + 
          "'. Allowed types: 'start', 'done', 'error', 'success'";
        }
        if (cb) {
          var index = callbacks[event].indexOf(cb);
          callbacks[event].splice(index, 1);
        } else {
          //Erase all events of this type if no cb specified to remvoe
          callbacks[event].length = 0;
        }
        return self;
      };
    }
    return function promiseTracker(trackerName, options) {
      if (!trackers[trackerName])  {
        trackers[trackerName] = new Tracker(options);
      }
      return trackers[trackerName];
    };
  }];
})

.config(['$httpProvider', function($httpProvider) {
  $httpProvider.responseInterceptors.push('trackerResponseInterceptor');
}])

/*
 * Intercept all http requests that have a `tracker` option in their config,
 * and add that http promise to the specified `tracker`
 */
.factory('trackerResponseInterceptor', ['$q', 'promiseTracker', '$injector', function($q, promiseTracker, $injector) {
  //We use $injector get around circular dependency problem for $http
  var $http;
  return function spinnerResponseInterceptor(promise) {
    if (!$http) $http = $injector.get('$http'); 
    
    //We know the latest request is always going to be last in the list
    var requestConfig = $http.pendingRequests[$http.pendingRequests.length-1];
    var trackerConfig;
    if ((trackerConfig = requestConfig.tracker)) {
      //Allow an array of trackers: $http.get('things', {tracker: ['itemTracker', 'stuffTracker']}
      if (!angular.isArray(trackerConfig)) {
        trackerConfig = [trackerConfig];
      }
      angular.forEach(trackerConfig, function(trackerName) {
        promiseTracker(trackerName).addPromise(promise, requestConfig);
      });
    }
    return promise;
  };
}])

;
