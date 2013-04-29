
angular.module('ajoslin.promise-tracker')

/*
 * Intercept all http requests that have a `tracker` option in their config,
 * and add that http promise to the specified `tracker`
 */

//angular versions before 1.1.4 use responseInterceptor format
.factory('trackerResponseInterceptor', ['$q', 'promiseTracker', '$injector', 
function($q, promiseTracker, $injector) {
  //We use $injector get around circular dependency problem for $http
  var $http;
  return function spinnerResponseInterceptor(promise) {
    if (!$http) $http = $injector.get('$http'); //lazy-load http
    //We know the latest request is always going to be last in the list
    var config = $http.pendingRequests[$http.pendingRequests.length-1];
    if (config.tracker) {
      promiseTracker(config.tracker).addPromise(promise, config);
    }
    return promise;
  };
}])

.factory('trackerHttpInterceptor', ['$q', 'promiseTracker', '$injector', 
function($q, promiseTracker, $injector) {
  return {
    request: function(config) {
      if (config.tracker) {
        var deferred = promiseTracker(config.tracker).createPromise(config);
        config.$promiseTrackerDeferred = deferred;
      }
      return $q.when(config);
    },
    response: function(response) {
      if (response.config.$promiseTrackerDeferred) {
        response.config.$promiseTrackerDeferred.resolve(response);
      }
      return $q.when(response);
    },
    responseError: function(response) {
      if (response.config.$promiseTrackerDeferred) {
        response.config.$promiseTrackerDeferred.reject(response);
      }
      return $q.reject(response);
    }
  };
}])

.config(['$httpProvider', function($httpProvider) {
  if ($httpProvider.interceptors) {
    //Support angularJS 1.1.4: interceptors
    $httpProvider.interceptors.push('trackerHttpInterceptor');
  } else {
    //Support angularJS pre 1.1.4: responseInterceptors
    $httpProvider.responseInterceptors.push('trackerResponseInterceptor');
  }
}])

;
