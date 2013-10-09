describe('provider', function() {
  function recentCallFirstArg(spy) {
    return spy.mostRecentCall.args[0];
  }

  beforeEach(module('ajoslin.promise-tracker'));

  var promiseTracker, $httpBackend, $http, $q, $rootScope;
  beforeEach(inject(function(_promiseTracker_, _$httpBackend_, _$http_, _$q_, _$rootScope_) {
    promiseTracker = _promiseTracker_;
    $httpBackend = _$httpBackend_;
    $http = _$http_;
    $q = _$q_;
    $rootScope = _$rootScope_;
  }));

  function digest() {
    $rootScope.$apply();
  }

  var myTracker;
  beforeEach(function() {
    myTracker = promiseTracker('myTracker');
  });

  it('should create a new tracker', function() {
    expect(myTracker).toBeTruthy();
  });

  it('should get the tracker each time myTracker(name) is called', function() {
    expect(promiseTracker('myTracker')).toBe(myTracker);
  });

  it('should be inactive at start', function() {
    expect(myTracker.active()).toBe(false);
  });

  it('should add a promise and return our new tracker promise', function() {
    expect(typeof myTracker.addPromise($q.defer().promise)).toBe('object');
  });

  it('should throw an error if we add a non-object', function() {
    expect(function() { myTracker.addPromise(null); }).toThrow();
  });

  it('should throw an error if we add a non-promise', function() {
    expect(function() { myTracker.addPromise({}); }).toThrow();
  });

  it('should allow you to add callbacks of the right type', function() {
    myTracker.on('start', angular.noop);
    myTracker.on('success', angular.noop);
    myTracker.on('error', angular.noop);
    myTracker.on('done', angular.noop);
  });

  it('should throw error if you add callback of wrong type', function() {
    expect(function() { myTracker.on('sarayu', angular.noop); }).toThrow();
  });

  it('should allow you to remove callbacks of the right type', function() {
    myTracker.off('start');
    myTracker.off('success');
    myTracker.off('error');
    myTracker.off('done');
  });

  it('should throw error if you remove callback of wrong type', function() {
    expect(function() { myTracker.off('sarayu'); }).toThrow();
  });

  describe('after adding a promise', function() {
    var deferred;
    beforeEach(function() {
      deferred = $q.defer();
      myTracker.addPromise(deferred.promise);
    });

    it('should be active at first', function() {
      expect(myTracker.active()).toBe(true);
    });
    it('should be inactive after resolving promise', function() {
      deferred.resolve();
      digest();
      expect(myTracker.active()).toBe(false);
    });
    it('should be inactive after rejecting promise', function() {
      deferred.reject();
      digest();
      expect(myTracker.active()).toBe(false);
    });
    it('should stay active while at least one promise is active', function() {
      var d1 = $q.defer();
      myTracker.addPromise(d1.promise);
      expect(myTracker.active()).toBe(true);
      d1.resolve();
      digest();
      expect(myTracker.active()).toBe(true);
      deferred.reject();
      digest();
      expect(myTracker.active()).toBe(false);
    });
  });

  describe('events', function() {
    var events = ['success','error','done','start'];
    var spies;

    beforeEach(function() {
      spies = {}, count = {};
      //Automatically create spies for all events, which just add to
      //a count for that event
      angular.forEach(events, function(event) {
        spies[event] = jasmine.createSpy();
        myTracker.on(event, spies[event]);
      });
    });

    it('should give a unique id in event callbacks for each promise', function() {
      var d1 = $q.defer(); d2 = $q.defer();
      myTracker.addPromise(d1.promise, 1);
      expect(spies.start).toHaveBeenCalledWith(1, '001');
      myTracker.addPromise(d2.promise, 2);
      expect(spies.start).toHaveBeenCalledWith(2, '002');
      d1.resolve(3);
      digest();
      expect(spies.done).toHaveBeenCalledWith(3, '001');
      expect(spies.success).toHaveBeenCalledWith(3, '001');
      d2.reject(4);
      digest();
      expect(spies.done).toHaveBeenCalledWith(4, '002');
      expect(spies.error).toHaveBeenCalledWith(4, '002');
    });

    it('should fire "start" with param when promise is added', function() {
      expect(spies.start.callCount).toBe(0);
      myTracker.addPromise($q.defer().promise, 3);
      expect(spies.done.callCount).toBe(0);
      expect(spies.start.mostRecentCall.args[0]).toEqual(3, '001');
    });
    it('should fire "done" with param when promise is resolved or rejected', function() {
      expect(spies.done).not.toHaveBeenCalled();
      expect(spies.error).not.toHaveBeenCalled();
      expect(spies.success).not.toHaveBeenCalled();
      var deferred = $q.defer();
      myTracker.addPromise(deferred.promise, "fun!");
      expect(spies.done).not.toHaveBeenCalled();
      expect(spies.error).not.toHaveBeenCalled();
      expect(spies.success).not.toHaveBeenCalled();
      expect(spies.start.mostRecentCall.args[0]).toEqual("fun!");
      deferred.resolve(11);
      digest();
      expect(spies.done.mostRecentCall.args[0]).toEqual(11);
      expect(spies.success.mostRecentCall.args[0]).toEqual(11);
      deferred = $q.defer();
      myTracker.addPromise(deferred.promise);
      deferred.reject(22);
      digest();
      expect(spies.done.mostRecentCall.args[0]).toEqual(22);
      expect(spies.error.mostRecentCall.args[0]).toEqual(22);
    });
    it('should fire "error" with param when promise is rejected', function() {
      expect(spies.error).not.toHaveBeenCalled();
      var deferred = $q.defer();
      myTracker.addPromise(deferred.promise);
      deferred.reject(7);
      digest();
      expect(spies.error.mostRecentCall.args[0]).toEqual(7);
    });
    it('should fire "success" with param when promise is resolve', function() {
      expect(spies.success).not.toHaveBeenCalled();
      var deferred = $q.defer();
      myTracker.addPromise(deferred.promise);
      expect(spies.success).not.toHaveBeenCalled();
      deferred.resolve(9);
      digest();
      expect(spies.success.mostRecentCall.args[0]).toEqual(9);
    });
    it('should fire all events, at right times', function() {
      var deferred = $q.defer();
      myTracker.addPromise(deferred.promise, 5);
      expect(spies.start.mostRecentCall.args[0]).toEqual(5);
      deferred.resolve(6);
      digest();
      expect(spies.start.callCount).toBe(1);
      expect(spies.success.mostRecentCall.args[0]).toEqual(6);
      expect(spies.error).not.toHaveBeenCalled();
      expect(spies.start.mostRecentCall.args[0]).toEqual(5);
      deferred = $q.defer();
      myTracker.addPromise(deferred.promise, 7);
      expect(spies.start.mostRecentCall.args[0]).toEqual(7);
      expect(spies.start.callCount).toBe(2);
      deferred.reject(8);
      digest();
      expect(spies.done.mostRecentCall.args[0]).toEqual(8);
      expect(spies.error.mostRecentCall.args[0]).toEqual(8);
      expect(spies.start.callCount).toBe(2);
      expect(spies.error.callCount).toBe(1);
      expect(spies.success.callCount).toBe(1);
      expect(spies.done.callCount).toBe(2);
    });
    it('should unbind only given function', function() {
      var spy = jasmine.createSpy();
      myTracker.on('start', spy);
      myTracker.off('start', spies.start);
      var deferred = $q.defer();
      myTracker.addPromise(deferred.promise, 5);
      expect(spies.start).not.toHaveBeenCalled();
      expect(spy.mostRecentCall.args[0]).toEqual(5);
    });
    it('should unbind all functions if none given', function() {
      var spy = jasmine.createSpy();
      myTracker.on('start', spy);
      myTracker.off('start');
      var deferred = $q.defer();
      myTracker.addPromise(deferred.promise, 5);
      expect(spies.start).not.toHaveBeenCalled();
      expect(spy).not.toHaveBeenCalled();
    });
  });

  describe('minimum duration', function() {
    var $timeout, track;
    beforeEach(inject(function(_$timeout_) {
      $timeout = _$timeout_;
      track = promiseTracker('track1', {
        minDuration: 1000
      });
    }));

    it('should wait until timeout is over to resolve on first promise', function() {
      var d = $q.defer();
      track.addPromise(d.promise);
      expect(track.active()).toBe(true);
      d.resolve();
      digest();
      expect(track.active()).toBe(true);
      $timeout.flush();
      digest();
      expect(track.active()).toBe(false);
    });

    it('should go back to not waiting if minDuration is 0', function() {
      track.setMinDuration(0);
      var d = $q.defer();
      track.addPromise(d.promise);
      expect(track.active()).toBe(true);
      d.resolve();
      digest();
      expect(track.active()).toBe(false);
    });

    it('should only fire events after timeout is over', function() {
      var d1 = $q.defer(), d2 = $q.defer();
      var spy = jasmine.createSpy();
      track.addPromise(d1.promise);
      track.addPromise(d2.promise);
      track.on('done', spy);
      d1.resolve();
      digest();
      expect(track.active()).toBe(true);
      expect(spy.callCount).toBe(0);
      $timeout.flush();
      expect(spy.callCount).toBe(1);
      expect(track.active()).toBe(true);
      d2.resolve();
      digest();
      expect(spy.callCount).toBe(2);
      expect(track.active()).toBe(false);
    });
  });

  describe('maximum duration', function() {
    var track, $timeout;
    beforeEach(inject(function(_$timeout_) {
      $timeout = _$timeout_;
      track = promiseTracker('maxxy', {
        maxDuration: 10000
      });
    }));

    it('should end on its own after maxDuration', function() {
      var d1 = $q.defer();
      track.addPromise(d1.promise);
      expect(track.active()).toBe(true);
      $timeout.flush();
      expect(track.active()).toBe(false);
    });

    it('should cleanup the maxDuration timeout after finishing', function() {
      var d1 = $q.defer();
      track.addPromise(d1.promise);
      expect(track.active()).toBe(true);
      d1.resolve();
      digest();
      expect(track.active()).toBe(false);
      expect($timeout.flush).toThrow();
    });
  });
});
