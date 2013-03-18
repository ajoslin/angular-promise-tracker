VERSION=0.0.1
FILENAME=promise-tracker

default:
	jshint src/*.js
	mkdir -p dist
	cat src/*.js > dist/${FILENAME}.js
	uglifyjs < dist/${FILENAME}.js > dist/${FILENAME}.min.js

test: 
	testacular start --single-run=true

server:
	testacular start

.PHONY: default test server
