VERSION=0.0.1
FILENAME=promise-tracker-v${VERSION}.js

default:
	jshint src/*.js
	mkdir -p dist
	cat src/*.js > dist/${FILENAME}

test: 
	testacular start --single-run=true

server:
	testacular start

.PHONY: default test server
