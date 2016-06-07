describe('promiseTracker provider', function() {
  beforeEach(module('ajoslin.promise-tracker'));

  var promiseTracker, timeout, q;
  beforeEach(inject(function(_promiseTracker_, $timeout, $q) {
    promiseTracker = _promiseTracker_;
    timeout = $timeout;
    q = $q;
  }));

  function digest() {
    inject(function($rootScope) { $rootScope.$digest(); });
  }

  it('should create a tracker with api', function() {
    var tracker = new promiseTracker();
    expect(typeof tracker.addPromise).toBe('function');
    expect(typeof tracker.createPromise).toBe('function');
    expect(typeof tracker.destroy).toBe('function');
    expect(typeof tracker.cancel).toBe('function');
  });

  it('should create a tracker even if no `new`', function() {
    var tracker = promiseTracker();
    expect(typeof tracker.addPromise).toBe('function');
  });

  it('should not be active by default', function() {
    expect(promiseTracker().active()).toBe(false);
  });

  it('should not be tracking by default', function() {
    expect(promiseTracker().tracking()).toBe(false);
  });

  describe('addPromise', function() {

    it('should error with object', function() {
      expect(function() { promiseTracker().addPromise({}); }).toThrow();
    });

    it('should error with deferred', function() {
      expect(function() { promiseTracker().addPromise(q.defer()); }).toThrow();
    });

    it('should not error with then, $then, $promise.then', function() {
      promiseTracker().addPromise(q.defer().promise);
      promiseTracker().addPromise({ $promise: q.defer().promise } );
    });

    it('should return promise from createPromise', function() {
      var tracker = promiseTracker();
      var promise = q.defer().promise;
      var created = q.defer();
      spyOn(tracker, 'createPromise').andCallFake(function() {
        return created;
      });
      var ret = tracker.addPromise(promise);
      expect(ret).toBe(created);
    });

    it('should resolve returned promise when passed in promise is resolved', function() {
      var tracker = promiseTracker();
      var deferred = q.defer();
      var trackerPromise = tracker.addPromise(deferred.promise);
      spyOn(trackerPromise, 'resolve');
      deferred.resolve(1);
      digest();
      expect(trackerPromise.resolve).toHaveBeenCalledWith(1);
    });

    it('should reject returned promise when passed in promise is rejected', function() {
      var tracker = promiseTracker();
      var deferred = q.defer();
      var trackerPromise = tracker.addPromise(deferred.promise);
      spyOn(trackerPromise, 'reject');
      deferred.reject(2);
      digest();
      expect(trackerPromise.reject).toHaveBeenCalledWith(2);
    });

    it('should start tracking with then, $then, $promise.then', function() {
      var tracker = promiseTracker();
      tracker.addPromise(q.defer().promise);
      expect(tracker.tracking()).toBe(true);

      tracker = promiseTracker();
      tracker.addPromise(q.defer().promise);
      expect(tracker.tracking()).toBe(true);

      tracker = promiseTracker();
      tracker.addPromise({ $promise: q.defer().promise });
      expect(tracker.tracking()).toBe(true);
    });

  });

  describe('createPromise', function() {

    it('should return a deferred', function() {
      expect(promiseTracker().createPromise().promise.then).toBeTruthy();
    });

    it('should set active to true when promise is added', function() {
      var tracker = promiseTracker();
      tracker.createPromise();
      expect(tracker.active()).toBe(true);
    });

    it('should set active to true when promises are added', function() {
      var tracker = promiseTracker();
      tracker.createPromise();
      tracker.createPromise();
      expect(tracker.active()).toBe(true);
    });

    it('should set active to false when promises are added and resolved/rejected', function() {
      var tracker = promiseTracker();
      var p1 = tracker.createPromise();
      var p2 = tracker.createPromise();
      expect(tracker.active()).toBe(true);
      p1.resolve();
      digest();
      expect(tracker.active()).toBe(true);
      p2.reject();
      digest();
      expect(tracker.active()).toBe(false);
    });

    it('should set tracking to true when promise is added', function() {
      var tracker = promiseTracker();
      tracker.createPromise();
      expect(tracker.tracking()).toBe(true);
    });

    it('should set tracking to true when promises are added', function() {
      var tracker = promiseTracker();
      tracker.createPromise();
      tracker.createPromise();
      expect(tracker.tracking()).toBe(true);
    });

    it('should set tracking to false when promises are added and resolved/rejected', function() {
      var tracker = promiseTracker();
      var p1 = tracker.createPromise();
      var p2 = tracker.createPromise();
      expect(tracker.tracking()).toBe(true);
      p1.resolve();
      digest();
      expect(tracker.tracking()).toBe(true);
      p2.reject();
      digest();
      expect(tracker.tracking()).toBe(false);
    });

  });

  it('cancel should deactivate and resolve all promises', function() {
    var tracker = promiseTracker();
    var p1 = tracker.createPromise();
    expect(tracker.active()).toBe(true);
    spyOn(p1, 'resolve');
    tracker.cancel();
    expect(p1.resolve).toHaveBeenCalled();
    expect(tracker.active()).toBe(false);
    expect(tracker.tracking()).toBe(false);
  });

  it('destroy should be cancel', function() {
    var tracker = promiseTracker();
    expect(tracker.destroy).toBe(tracker.cancel);
  });

  describe('activationDelay', function() {

    it('should not be active() until delay is over', function() {
      var tracker = promiseTracker({ activationDelay: 1000 });
      tracker.createPromise();

      //Should not be active due to delay
      expect(tracker.active()).toBe(false);
      tracker.createPromise();
      expect(tracker.active()).toBe(false);

      //Flush, it should be active
      timeout.flush();
      expect(tracker.active()).toBe(true);
    });

    it('should be tracking irrespective of the activation delay', function() {
      var tracker = promiseTracker({ activationDelay: 1000 });
      tracker.createPromise();

      //Should be tracking
      expect(tracker.tracking()).toBe(true);
      tracker.createPromise();
      expect(tracker.tracking()).toBe(true);

      //Flush, it should be tracking
      timeout.flush();
      expect(tracker.tracking()).toBe(true);
    });

  });

  describe('minDuration', function() {

    it('should be active() for at least minDuration', function() {
      var tracker = promiseTracker({ minDuration: 1000 });
      var p1 = tracker.createPromise();
      expect(tracker.active()).toBe(true);
      p1.resolve();
      digest();
      //Should still be active until minDuration timeout elapses
      expect(tracker.active()).toBe(true);
      timeout.flush();
      expect(tracker.active()).toBe(false);
    });

    it('should not deactivate if there is still another promise active', function() {
      var tracker = promiseTracker({ minDuration: 1000 });
      var p1 = tracker.createPromise();
      expect(tracker.active()).toBe(true);
      p1.resolve();
      digest();
      //Should still be active until minDuration timeout elapses
      expect(tracker.active()).toBe(true);
      var p2 = tracker.createPromise();
      timeout.flush();
      expect(tracker.active()).toBe(true);
      p2.resolve();
      digest();
      expect(tracker.active()).toBe(false);
    });

    it('should be tracking for at least minDuration', function() {
      var tracker = promiseTracker({ minDuration: 1000 });
      var p1 = tracker.createPromise();
      expect(tracker.tracking()).toBe(true);
      p1.resolve();
      digest();
      //Should still be tracking until minDuration timeout elapses
      expect(tracker.tracking()).toBe(true);
      timeout.flush();
      expect(tracker.tracking()).toBe(false);
    });

    it('should continue tracking if there is still another promise active', function() {
      var tracker = promiseTracker({ minDuration: 1000 });
      var p1 = tracker.createPromise();
      expect(tracker.tracking()).toBe(true);
      p1.resolve();
      digest();
      //Should still be tracking until minDuration timeout elapses
      expect(tracker.tracking()).toBe(true);
      var p2 = tracker.createPromise();
      timeout.flush();
      expect(tracker.tracking()).toBe(true);
      p2.resolve();
      digest();
      expect(tracker.tracking()).toBe(false);
    });

  });

  describe('minDuration + activationDelay', function() {

    it('should delay, be active, wait until duration, then be inactive', function() {
      var tracker = promiseTracker({ minDuration: 500, activationDelay: 250 });
      var p1 = tracker.createPromise();
      expect(tracker.active()).toBe(false);
      timeout.flush();
      expect(tracker.active()).toBe(true);
      p1.resolve();
      digest();
      expect(tracker.active()).toBe(true);
      timeout.flush();
      expect(tracker.active()).toBe(false);
    });

    it('should delay, be tracking, wait until duration, then be not tracking', function() {
      var tracker = promiseTracker({ minDuration: 500, activationDelay: 250 });
      expect(tracker.tracking()).toBe(false);
      var p1 = tracker.createPromise();
      expect(tracker.tracking()).toBe(true);
      timeout.flush();
      expect(tracker.tracking()).toBe(true);
      p1.resolve();
      digest();
      expect(tracker.tracking()).toBe(true);
      timeout.flush();
      expect(tracker.tracking()).toBe(false);
    });

  });

});
