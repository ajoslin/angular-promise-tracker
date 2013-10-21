
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

