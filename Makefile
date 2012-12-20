MOCHA_OPTS=
REPORTER = dot

check: test

test: test-unit

test-unit:
	@NODE_ENV=test ./node_modules/.bin/mocha \
			--reporter $(REPORTER) \
			--require test/lib/test_helper.js \
			--colors
			$(MOCHA_OPTS)
