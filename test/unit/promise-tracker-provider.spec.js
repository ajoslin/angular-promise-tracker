describe('provider', function() {
  beforeEach(module('ajoslin.promise-tracker'));

  describe('basics', function() {
    var myTracker;
    var promiseTracker, $httpBackend, $http, $q, $rootScope;
    beforeEach(inject(function(_promiseTracker_, _$httpBackend_, _$http_, _$q_, _$rootScope_) {
      promiseTracker = _promiseTracker_;
      $httpBackend = _$httpBackend_;
      $http = _$http_;
      $q = _$q_;
      $rootScope = _$rootScope_;
      myTracker = promiseTracker.register('myTracker');
    }));

    it('if we register a tracker with same name that exists already, it should error', function() {
      expect(function() {
        promiseTracker.register('myTracker');
      }).toThrow();
    });

    it('should throw an error if we ge ta tracker that doesn\'t exist', function() {
      expect(function() {
        promiseTracker('new guy');
      }).toThrow();
      promiseTracker.register('new guy');
      expect(promiseTracker('new guy')).toBeTruthy();
    });

    it('should remove a tracker on deregister', function() {
      spyOn(myTracker, '_destroy');
      promiseTracker.deregister('myTracker');
      expect(myTracker._destroy).toHaveBeenCalled();
      expect(function() {
        promiseTracker('myTracker');
      }).toThrow();
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
        $rootScope.$apply();
        expect(myTracker.active()).toBe(false);
      });
      it('should be inactive after rejecting promise', function() {
        deferred.reject();
        $rootScope.$apply();
        expect(myTracker.active()).toBe(false);
      });
      it('should stay active while at least one promise is active', function() {
        var d1 = $q.defer();
        myTracker.addPromise(d1.promise);
        expect(myTracker.active()).toBe(true);
        d1.resolve();
        $rootScope.$apply();
        expect(myTracker.active()).toBe(true);
        deferred.reject();
        $rootScope.$apply();
        expect(myTracker.active()).toBe(false);
      });
      it('should go inactive when cancelling', function() {
        var d1 = $q.defer();
        myTracker.addPromise(d1.promise);
        expect(myTracker.active()).toBe(true);
        myTracker.cancel();
        $rootScope.$apply();
        expect(myTracker.active()).toBe(false);
      });
    });
  });

  describe('options', function() {

    function setup(id, options) {
      inject(function(promiseTracker) {
        promiseTracker.register(id, options || {});
      });
    }

    describe('minimum duration', function() {

      beforeEach(function() {
        setup('tracky', { minDuration: 500 });
      });

      it('should wait until timeout is over to go inactive', inject(function($timeout, $q, $rootScope, promiseTracker) {
        var track = promiseTracker('tracky');
        var d = $q.defer();
        track.addPromise(d.promise);
        expect(track.active()).toBe(true);
        d.resolve();
        $rootScope.$apply();
        expect(track.active()).toBe(true);
        $timeout.flush();
        $rootScope.$apply();
        expect(track.active()).toBe(false);
      }));
    });

    describe('maximum duration', function() {
      beforeEach(function() {
        setup('trackyer', { maxDuration: 10000 });
      });

      it('should end on its own after maxDuration', inject(function($q, $timeout, $rootScope, promiseTracker) {
        var track = promiseTracker('trackyer');
        var d1 = $q.defer();
        track.addPromise(d1.promise);
        expect(track.active()).toBe(true);
        $timeout.flush();
        expect(track.active()).toBe(false);
      }));

      it('should cleanup the maxDuration timeout after finishing', inject(function($q, $timeout, $rootScope, promiseTracker) {
        var track = promiseTracker('trackyer');
        var d1 = $q.defer();
        spyOn($timeout, 'cancel');
        expect(track._maxPromise).toBeUndefined();
        track.addPromise(d1.promise);
        expect(track.active()).toBe(true);
        expect($timeout.cancel).not.toHaveBeenCalled(); //sanity
        d1.resolve();
        $rootScope.$apply();
        expect($timeout.cancel).toHaveBeenCalled();
        expect(track.active()).toBe(false);
        expect(track._maxPromise).toBeFalsy();
      }));
    });

    describe('activation delay', function() {
      beforeEach(function() {
        setup('good tracker', { activationDelay: 750 });
      });

      it('should not be active until delay elapses', inject(function($q, $timeout, $rootScope, promiseTracker) {
        var track = promiseTracker('good tracker');
        var d = $q.defer();
        expect(track._delayPromise).toBeUndefined();
        track.addPromise(d.promise);
        expect(track.active()).toBe(false);
        $timeout.flush();
        expect(track.active()).toBe(true);
        d.resolve();
        $rootScope.$apply();
        expect(track.active()).toBe(false);
      }));

      it('should, even if adding multiple promises, not be active until delay elapses', inject(function($q, $timeout, $rootScope, promiseTracker) {
        var track = promiseTracker('good tracker');
        var d1 = $q.defer(), d2 = $q.defer();
        track.addPromise(d1.promise);
        expect(track.active()).toBe(false);
        track.addPromise(d2.promise);
        expect(track.active()).toBe(false);
        $timeout.flush();
        expect(track.active()).toBe(true);
        d1.resolve();
        $rootScope.$apply();
        expect(track.active()).toBe(true);
        d2.reject();
        $rootScope.$apply();
        expect(track.active()).toBe(false);
      }));

      it('should cleanup activationDelay $timeout if the tracker ends early', inject(function($q, $timeout, $rootScope, promiseTracker) {
        var track = promiseTracker('good tracker');
        var d1 = $q.defer();
        spyOn($timeout, 'cancel');
        track.addPromise(d1.promise);
        expect(track.active()).toBe(false);
        expect($timeout.cancel).not.toHaveBeenCalled(); //sanity
        d1.resolve();
        $rootScope.$apply();
        expect($timeout.cancel).toHaveBeenCalled(); //sanity
        expect(track.active()).toBe(false);
      }));

    });

    describe('activationDelay, minDuration, maxDuration', function() {
      it('min and activationDelay', function() {
        setup('md', {
          activationDelay: 100,
          minDuration: 200
        });
        inject(function($timeout, $q, $rootScope, promiseTracker) {
          var track = promiseTracker('md');
          var d1 = $q.defer();
          track.addPromise(d1.promise);
          expect(track.active()).toBe(false);
          $timeout.flush(); //delay goes
          expect(track.active()).toBe(true);
          d1.resolve();
          $rootScope.$apply();
          //Should still be going due to minDuration
          expect(track.active()).toBe(true);
          $timeout.flush();
          expect(track.active()).toBe(false);
        });
      });
      it('max and activationDelay', function() {
        setup('maxd', {
          activationDelay: 100,
          maxDuration: 200
        });
        inject(function($timeout, $q, $rootScope, promiseTracker) {
          var track = promiseTracker('maxd');
          var d1 = $q.defer();
          track.addPromise(d1.promise);
          $timeout.flush(); //delay goes
          expect(track.active()).toBe(true);
          $timeout.flush(); //let maxDuration elapse
          expect(track.active()).toBe(false);
        });
      });
    });
  });

});
