/*
 * promise-tracker - v2.1.0 - 2014-11-15
 * http://github.com/ajoslin/angular-promise-tracker
 * Created by Andy Joslin; Licensed under Public Domain
 */

(function() {

angular.module('ajoslin.promise-tracker')
.config(['$httpProvider', function($httpProvider) {
  $httpProvider.interceptors.push(['$q', 'promiseTracker', function($q, promiseTracker) {

    var cachedConfigs = {};

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

        // cache request config
        if (config.cache) {
          if (! cachedConfigs[config.url]) {
            cachedConfigs[config.url] = [];
          }
          cachedConfigs[config.url].push(config);
        }
        return $q.when(config);
      },
      response: function(response) {
        var config = cachedConfigs[response.config.url]? cachedConfigs[response.config.url].shift() : response.config;

        if (config && config.$promiseTrackerDeferred) {
          angular.forEach(config.$promiseTrackerDeferred, function(deferred) {
            deferred.resolve(response);
          });
        }

        if (cachedConfigs[config.url] && cachedConfigs[config.url].length == 0) delete cachedConfigs[config.url];
        return $q.when(response);
      },
      responseError: function(response) {
        var config = cachedConfigs[response.config.url] ? cachedConfigs[response.config.url].shift() : response.config;

        if (config && config.$promiseTrackerDeferred) {
          angular.forEach(config.$promiseTrackerDeferred, function(deferred) {
            deferred.reject(response);
          });
        }

        if (cachedConfigs[config.url] && cachedConfigs[config.url].length == 0) delete cachedConfigs[config.url];
        return $q.reject(response);
      }
    };
  }]);
}]);

}());