/*
 * promise-tracker - v1.5.0 - 2014-01-02
 * http://github.com/ajoslin/angular-promise-tracker
 * Created by Andy Joslin; Licensed under Public Domain
 */

(function() {
angular.module('ajoslin.promise-tracker', []);


angular.module('ajoslin.promise-tracker')
.config(['$httpProvider', function($httpProvider) {
  if ($httpProvider.interceptors) {
    //Support angularJS 1.1+: interceptors
    $httpProvider.interceptors.push(TrackerHttpInterceptor);
  } else {
    //Support angularJS pre 1.0.x: responseInterceptors
    $httpProvider.responseInterceptors.push(TrackerResponseInterceptor);
  }
}]);

/*
 * Intercept all http requests that have a `tracker` option in their config,
 * and add that http promise to the specified `tracker`
 */

//angular-1.1.4+ format
function TrackerResponseInterceptor($q, promiseTracker, $injector) {
  //We use $injector get around circular dependency problem for $http
  var $http;
  return function trackerResponse(promise) {
    if (!$http) {
      $http = $injector.get('$http'); //lazy-load http
    }

    //We know the latest request is always going to be last in the list
    var config = $http.pendingRequests[$http.pendingRequests.length-1];

    if (config.tracker) {
      if (!angular.isArray(config.tracker)) {
        config.tracker = [config.tracker];
      }
      angular.forEach(config.tracker, function(trackerName) {
        promiseTracker(trackerName).addPromise(promise, config);
      });
    }

    return promise;
  };
}
TrackerResponseInterceptor.$inject = ['$q', 'promiseTracker', '$injector'];

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

  /**
   * nextUid(), from angularjs source
   *
   * A consistent way of creating unique IDs in angular. The ID is a sequence of alpha numeric
   * characters such as '012ABC'. The reason why we are not using simply a number counter is that
   * the number string gets longer over time, and it can also overflow, where as the nextId
   * will grow much slower, it is a string, and it will never overflow.
   *
   * @returns string unique alpha-numeric string
   */
  var uid = ['0','0','0'];
  function nextUid() {
    var index = uid.length;
    var digit;

    while(index) {
      index--;
      digit = uid[index].charCodeAt(0);
      if (digit === 57 /*'9'*/) {
        uid[index] = 'A';
        return uid.join('');
      }
      if (digit === 90  /*'Z'*/) {
        uid[index] = '0';
      } else {
        uid[index] = String.fromCharCode(digit + 1);
        return uid.join('');
      }
    }
    uid.unshift('0');
    return uid.join('');
  }
  var trackers = {};

  this.$get = ['$q', '$timeout', function($q, $timeout) {
    var self = this;

    function Tracker(options) {
      var self = this;
      //Define our callback types.  The user can catch when a promise starts,
      //has an error, is successful, or just is done with error or success.
      var callbacks = {
        start: [], //Start is called when a new promise is added
        done: [], //Called when a promise is finished (error or success)
        error: [], //Called on error.
        success: [] //Called on success.
      };
      var trackedPromises = [];
      options = options || {};

      //Allow an optional "minimum duration" that the tracker has to stay
      //active for. For example, if minimum duration is 1000ms and the user
      //adds three promises that all resolve after 650ms, the tracker will
      //still count itself as active until 1000ms have passed.
      self.setMinDuration = function(minimum) {
        self._minDuration = minimum;
      };
      self.setMinDuration(options.minDuration);

      //Allow an option "maximum duration" that the tracker can stay active.
      //Ideally, the user would resolve his promises after a certain time to
      //achieve this 'maximum duration' option, but there are a few cases
      //where it is necessary anyway.
      self.setMaxDuration = function(maximum) {
        self._maxDuration = maximum;
      };
      self.setMaxDuration(options.maxDuration);

      self.setActivationDelay = function(newDelay) {
        self._activationDelay = newDelay;
      };
      self.setActivationDelay(options.activationDelay);

      //## active()
      self.active = function() {
        if (self._delayPromise) {
          return false;
        }
        return trackedPromises.length > 0;
      };

      //## cancel()
      self.cancel = function() {
        angular.forEach(trackedPromises, function(deferred) {
          deferred.resolve();
        });
      };

      //Fire an event bound with #on().
      //@param options: {id: uniqueId, event: string, value: someValue}
      function fireEvent(options) {
        angular.forEach(callbacks[options.event], function(cb) {
          cb.call(self, options.value, options.id);
        });
      }

      //Create a promise that will make our tracker active until it is resolved.
      //@param startArg: params to pass to 'start' event
      //@return deferred - our deferred object that is being tracked
      function createPromise(startArg) {
        //We create our own promise to track. This usually piggybacks on a given
        //promise, or we give it back and someone else can resolve it (like
        //with the httpResponseInterceptor).
        //Using our own promise also lets us do things like cancel early or add
        //a minimum duration.
        var deferred = $q.defer();
        var promiseId = nextUid();

        trackedPromises.push(deferred);

        //If the tracker was just inactive and this the first in the list of
        //promises, we reset our 'minimum duration' and 'maximum duration'
        //again.
        if (trackedPromises.length === 1) {
          if (self._activationDelay) {
            self._delayPromise = $timeout(function() {
              self._delayPromise = null;
              startMinMaxDuration();
            }, self._activationDelay);
          } else {
            startMinMaxDuration();
          }
        }

        function startMinMaxDuration() {
          if (self._minDuration) {
            self._minPromise = $timeout(angular.noop, self._minDuration);
          }
          if (self._maxDuration) {
            self._maxPromise = $timeout(deferred.resolve, self._maxDuration);
          }
        }

        fireEvent({
          event: 'start',
          id: promiseId,
          value: startArg
        });

        deferred.promise.then(onDone(false), onDone(true));

        //Create a callback for when this promise is done. It will remove our
        //tracked promise from the array and call the appropriate event
        //callbacks depending on whether there was an error or not.
        function onDone(isError) {
          return function(value) {
            //Before resolving our promise, make sure the minDuration timeout
            //has finished.
            (self._minPromise || $q.when()).then(function() {
              var index = trackedPromises.indexOf(deferred);
              trackedPromises.splice(index, 1);

              //If this is the last promise, cleanup the timeouts
              //for maxDuration and activationDelay
              if (trackedPromises.length === 0) {
                if (self._maxPromise) {
                  $timeout.cancel(self._maxPromise);
                  self._maxPromise = null;
                }
                if (self._delayPromise) {
                  $timeout.cancel(self._delayPromise);
                  self._delayPromise = null;
                }
              }

              fireEvent({
                event: isError ? 'error' : 'success',
                id: promiseId,
                value: value
              });
              fireEvent({
                event: 'done',
                id: promiseId,
                value: value
              });
            });
          };
        }

        return deferred;
      }

      //## addPromise()
      //Adds a given promise to our tracking
      self.addPromise = function(promise, startArg) {
        var then = promise && (promise.then ||
                               promise.$then ||
                               (promise.$promise && promise.$promise.then));
        if (!then) {
          throw new Error("promiseTracker#addPromise expects a promise object!");
        }

        var deferred = createPromise(startArg);

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

      //## createPromise()
      //Create a new promise and return it, and let the user resolve it how
      //they see fit.
      self.createPromise = createPromise;

      //## on(), bind()
      //ALlow user to bind to start, done, error, or success events for tracked
      //promises.
      self.on = self.bind = function(event, cb) {
        if (!callbacks[event]) {
          throw new Error("Cannot bind callback for event '" + event +
          "'. Allowed types: 'start', 'done', 'error', 'success'");
        }
        callbacks[event].push(cb);
        return self;
      };
      //Allow user to unbind any event. If a callback is given, it will unbind
      //that callback.  Else, it will unbind all the callbacks for that event.
      //Similar to jQuery.
      self.off = self.unbind = function(event, cb) {
        if (!callbacks[event]) {
          throw new Error("Cannot unbind callback for event '" + event +
          "'. Allowed types: 'start', 'done', 'error', 'success'");
        }
        if (cb) {
          var index = callbacks[event].indexOf(cb);
          callbacks[event].splice(index, 1);
        } else {
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
;

}());