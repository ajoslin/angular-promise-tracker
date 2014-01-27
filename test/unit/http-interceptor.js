
describe('interceptor', function() {
  beforeEach(module('ajoslin.promise-tracker'));

  var promiseTracker, $httpBackend, $http, $q, $rootScope;
  beforeEach(inject(function(_promiseTracker_, _$httpBackend_, _$http_, _$q_, _$rootScope_) {
    promiseTracker = _promiseTracker_;
    $httpBackend = _$httpBackend_;
    $http = _$http_;
    $q = _$q_;
    $rootScope = _$rootScope_;
    promiseTracker.register('tracky', {});
    promiseTracker.register('andy', {});
    promiseTracker.register('jonny', {});
    promiseTracker.register('joe', {});
  }));

  function digest() {
    $rootScope.$apply();
  }

  var tracky;
  beforeEach(function() {
    tracky = promiseTracker('tracky');
    $httpBackend.whenGET("/pizza").respond("pepperoni");
    $httpBackend.whenGET("/pie").respond("apple");
    $httpBackend.whenGET("/error").respond(500, "monkeys");
  });

  it('should not track an http request with no tracker option', function() {
    $http.get('/pizza');
    digest();
    expect(tracky.active()).toBe(false);
    $httpBackend.flush();
    expect(tracky.active()).toBe(false);
  });

  it('should track an http request with tracker option', function() {
    $http.get('/pizza', { tracker: 'tracky' });
    digest();
    expect(tracky.active()).toBe(true);
    $httpBackend.flush();
    expect(tracky.active()).toBe(false);
  });

  it('should create a new tracker if http request gives new name', function() {
    $http.get('/pizza', { tracker: 'jonny' });
    digest();
    expect(promiseTracker('jonny').active()).toBe(true);
    $httpBackend.flush();
    expect(promiseTracker('jonny').active()).toBe(false);
  });

  it('should allow an array of tracker in the options', function() {
    $http.get('/pie', { tracker: ['andy'] });
    digest();
    expect(promiseTracker('andy').active()).toBe(true);
    $httpBackend.flush();
    expect(promiseTracker('andy').active()).toBe(false);
  });

  it('should allow multiple trackers in the options', function() {
    $http.get('/pizza', { tracker: ['jonny', 'joe'] });
    digest();
    expect(promiseTracker('jonny').active()).toBe(true);
    expect(promiseTracker('joe').active()).toBe(true);
    $httpBackend.flush();
    expect(promiseTracker('jonny').active()).toBe(false);
    expect(promiseTracker('joe').active()).toBe(false);
  });
});
