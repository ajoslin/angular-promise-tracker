
angular.module('ajoslin.promise-tracker')
.config(['$httpProvider', function($httpProvider) {
  $httpProvider.interceptors.push(['$q', 'promiseTracker', function($q, promiseTracker) {
    function handleResponse(type, response) {
      if (response.config && response.config.$promiseTrackerDeferred) {
        response.config.$promiseTrackerDeferred.forEach(function(deferred) {
          deferred[type](response);
        });
      }
      return $q[type](response);
    }

    return {
      request: function(config) {
        if (config.tracker) {
          if (!angular.isArray(config.tracker)) {
            config.tracker = [config.tracker];
          }
          config.$promiseTrackerDeferred = config.$promiseTrackerDeferred || [];

          config.tracker.forEach(function(tracker) {
            var deferred = tracker.createPromise();
            config.$promiseTrackerDeferred.push(deferred);
          });
        }
        return $q.resolve(config);
      },
      response: handleResponse.bind(null, 'resolve'),
      responseError: handleResponse.bind(null, 'reject')
    };
  }]);
}]);
