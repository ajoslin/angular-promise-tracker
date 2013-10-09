
describe('ngResource', function() {
  beforeEach(module('ajoslin.promise-tracker'));
  beforeEach(module('ngResource'));

  var $q, Pizza, $rootScope, $httpBackend, myTracker;
  beforeEach(inject(function(promiseTracker, _$q_, $resource, _$rootScope_, _$httpBackend_) {
    $httpBackend = _$httpBackend_;
    Pizza = new $resource('/hello/', {}, {
      get: { method: "GET", isArray: false }
    });
    $rootScope = _$rootScope_;
    $q = _$q_;

    $httpBackend.whenGET("/hello").respond('get', 200);

    myTracker = promiseTracker('myTracker');
  }));

  function digest() { $rootScope.$apply(); }

  it('should add a $resource promise', function() {
    var pizza = Pizza.get();
    digest();
    myTracker.addPromise(pizza);
    expect(myTracker.active()).toBe(true);
    $httpBackend.flush();
    expect(myTracker.active()).toBe(false);
  });

  it('should add a $resource instance promise', function() {
    var p = new Pizza();
    p.$get();
    digest();
    myTracker.addPromise(p);
    expect(myTracker.active()).toBe(true);
    $httpBackend.flush();
    expect(myTracker.active()).toBe(false);
  });

  it('should instantly resolve if resource instance promise is already resolved', function() {
    var p = new Pizza();
    p.$get();
    myTracker.addPromise(p);
    digest();
    expect(myTracker.active()).toBe(true);
    $httpBackend.flush();
    expect(myTracker.active()).toBe(false);
    myTracker.addPromise(p);
    digest();
    expect(myTracker.active()).toBe(false);
  });

  it('should instantly resolve if $resource promise is already resolved', function() {
    var p = Pizza.get();
    myTracker.addPromise(p);
    digest();
    expect(myTracker.active()).toBe(true);
    $httpBackend.flush();
    expect(myTracker.active()).toBe(false);
    myTracker.addPromise(p);
    digest();
    expect(myTracker.active()).toBe(false);
  });

});
