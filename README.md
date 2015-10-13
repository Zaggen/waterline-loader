# waterline-loader
A module to load waterline Collections and turn them into globals, mainly for unit testing sails.js


### Usage Example (CoffeeScript)

waterlineLoader = require('waterlineLoader')
```coffee
# test/mochaBootstrap.coffee

waterlineLoader = require('./waterlineLoader')

before (done)->
  @timeout(8000)
  config =
    # Add a list of all the sails.js modules (POJOs) you want to
    # convert into sails models (waterline collections) globals.
    models:['News', 'Tag', 'NewsCategory', 'Gallery', 'Artist', 'User']

  waterlineLoader.init(models, done)

after (done)->
  @timeout(8000)
  waterlineLoader.teardown(done)
```