describe('http interceptor', function() {

  beforeEach(module('ajoslin.promise-tracker'));

  var http, promiseTracker, backend, q;
  beforeEach(inject(function($http, _promiseTracker_, $httpBackend, $q) {
    http = $http;
    promiseTracker = _promiseTracker_;
    $httpBackend.whenGET('/ok').respond(200);
    $httpBackend.whenGET('/error').respond(404);
    backend = $httpBackend;
    q = $q;
  }));

  function digest() {
    inject(function($rootScope) { $rootScope.$digest(); });
  }

  it('should add a promise to tracking with http config option', function() {
    var tracker = promiseTracker();
    var tracker2 = promiseTracker();
    spyOn(tracker, 'createPromise').andCallThrough();
    spyOn(tracker2, 'createPromise').andCallThrough();

    http.get('/ok', { tracker: tracker });
    digest();
    expect(tracker.createPromise).toHaveBeenCalled();

    tracker.createPromise.reset();
    http.get('/ok', { tracker: [tracker,tracker2] });
    digest();
    expect(tracker.createPromise).toHaveBeenCalled();
    expect(tracker2.createPromise).toHaveBeenCalled();
  });

  it('should resolve on good response', function(){
    var tracker = promiseTracker();
    var deferred = q.defer();
    spyOn(tracker, 'createPromise').andCallFake(function() {
      return deferred;
    });
    spyOn(deferred, 'resolve');

    http.get('/ok', { tracker: tracker });
    digest();
    backend.flush();
    expect(deferred.resolve).toHaveBeenCalled();
    expect(deferred.resolve.mostRecentCall.args[0].status).toBe(200);
  });

  it('should reject on error response', function(){
    var tracker = promiseTracker();
    var deferred = q.defer();
    spyOn(tracker, 'createPromise').andCallFake(function() {
      return deferred;
    });
    spyOn(deferred, 'reject');

    http.get('/error', { tracker: tracker });
    digest();
    backend.flush();
    expect(deferred.reject).toHaveBeenCalled();
    expect(deferred.reject.mostRecentCall.args[0].status).toBe(404);
  });
});
