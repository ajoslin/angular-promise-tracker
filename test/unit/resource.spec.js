describe('ngResource', function() {
  beforeEach(module('ajoslin.promise-tracker', 'ngResource'));

  var $q, Pizza, $rootScope, $httpBackend, myTracker;
  beforeEach(inject(function(promiseTracker, _$q_, $resource, _$rootScope_, _$httpBackend_) {
    $httpBackend = _$httpBackend_;
    Pizza = new $resource('/hello/', {}, {
      get: { method: "GET" },
      post: { method: "POST" }
    });
    $rootScope = _$rootScope_;
    $q = _$q_;

    $httpBackend.whenGET("/hello").respond('get', 200);
    $httpBackend.whenPOST("/hello").respond('post', 500);

    myTracker = promiseTracker('myTracker');
  }));

  function digest() { $rootScope.$apply(); }

  it('should add a $resource promise', function() {
    var pizza = Pizza.get();
    myTracker.addPromise( $q.when(Pizza.$then) );
    expect(myTracker.active()).toBe(true);
    digest();
    $httpBackend.flush();
    expect(myTracker.active()).toBe(false);
  });

  it('should add a $resource instance promise', function() {
    var p = new Pizza();
    p.$get();
    myTracker.addPromise( $q.when(p.$then) );
    expect(myTracker.active()).toBe(true);
    digest();
    $httpBackend.flush();
    expect(myTracker.active()).toBe(false);
  });

  it('should instantly resolve if resource instance promise is already resolved', function() {
    var p = new Pizza();
    p.$get();
    myTracker.addPromise( $q.when(p.$then) );
    expect(myTracker.active()).toBe(true);
    digest();
    $httpBackend.flush();
    expect(myTracker.active()).toBe(false);
    myTracker.addPromise( $q.when(p.$then) );
    digest();
    expect(myTracker.active()).toBe(false);
  });

  it('should instantly resolve if $resource promise is already resolved', function() {
    Pizza.get();
    myTracker.addPromise( $q.when(Pizza.$then) );
    expect(myTracker.active()).toBe(true);
    digest();
    $httpBackend.flush();
    expect(myTracker.active()).toBe(false);
    myTracker.addPromise( $q.when(Pizza.$then) );
    digest();
    expect(myTracker.active()).toBe(false);
  });

});
