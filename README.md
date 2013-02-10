angular-promise-tracker
=======================

## What?

So you're building your angular app.  And you want a loading spinner.

You've tried the [normal solution](http://jsfiddle.net/zdam/dBR2r/) (or maybe you haven't), and it has problems.  It presents a loading spinner on *every request*!

But you don't want the same global loading spinner whenever any request happens anywhere. That just won't work!

Instead, you want different indicators while different types of request are loading.  You want one spinner while you're fetching data having to do with a user's pizza order, one while fetching user's profile data, and maybe another for some random service you have that returns a promise. All these on different parts of the UI.  Heck, maybe you don't even want a spinner.  You just want to know while http requests of some type are pending.

Well, [sigh no more](http://www.youtube.com/watch?v=eltHv58l8ig) my dear friend, your troubles are over.

We now have an easy solution for ya! Here's how it looks.

- **Throw a promiseTracker onto your scope.**

```js
function MyCtrl($scope, promiseTracker) {
  $scope.pizzaTracker = promiseTracker('pizza');
}
```

- **Do some requests, and in their config add in a little option called `tracker`.**

```js
$http.get('/pizzaFlavor', { tracker: 'pizza' });
$http.get('/pizzaType', { tracker: 'pizza' });
$http.get('/pizzaCrust', { tracker: 'pizza' });
```

- **Now the awesomes happen: `pizzaTracker.active()` will be true whenever any request with `tracker: 'pizza'` is waiting for response!**
 

```html
<div ng-show="pizzaTracker.active()" style="background: pink;">
  Loading some pizza data for ya, sir! ...
</div>
```

- **But wait, there's more! You can also catch cool events when stuff happens on any pizza promise...**

```js
$scope.pizzaTracker.on('error', function(response) {
  $scope.pizzaError = "Uh oh, some sort of pizza error happened! " + response.data;
});
$http.get('/pizzaError', { tracker: 'pizza' });
```
```html
<b ng-show="pizzaError" style="color:red;">!! {{pizzaError}} !!</b>
```

You can catch any of these events: `'error'`, `'success'`, `'start'`, `'done'`.  Hopefully they all make sense.


- **Oh, and did I mention... you can attach any old promise to your pizza tracker.  Not just http requests!**

```js
var myPizzaPromise = $q.defer();
$scope.pizzaTracker.addPromise(myPizzaPromise.promise);
```

## Documentation/API 

* Eh, what?  You want full documentation?  Well you'll just have to wait, ya young whippersnapper! There'll be an API up here soon, and maybe some docco docs of the source for ya!

## Development

* Install jshint and uglifyjs with `npm install -g uglifyjs jshint`
* Run `make` to build, `make test` to single run tests, and `make server` to start the test server
