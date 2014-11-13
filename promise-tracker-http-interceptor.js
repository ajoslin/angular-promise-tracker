/*
 * promise-tracker - v2.1.0 - 2014-11-15
 * http://github.com/ajoslin/angular-promise-tracker
 * Created by Andy Joslin; Licensed under Public Domain
 */

(function() {

angular.module('ajoslin.promise-tracker')
.config(['$httpProvider', function($httpProvider) {
  $httpProvider.interceptors.push(['$q', 'promiseTracker', function($q, promiseTracker) {
    return {
      request: function(config) {
        if (config.tracker) {
          if (!angular.isArray(config.tracker)) {
            config.tracker = [config.tracker];
          }
          config.$promiseTrackerDeferred = config.$promiseTrackerDeferred || [];

          angular.forEach(config.tracker, function(tracker) {
            var deferred = tracker.createPromise();
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
  }]);
}]);

}());