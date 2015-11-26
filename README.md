# waterline-loader
A module to load waterline Collections and turn them into globals, mainly for unit testing sails.js


### Usage Example (CoffeeScript)


```coffee
# test/mochaBootstrap.coffee

waterlineLoader = require('waterlineLoader')

before (done)->
  @timeout(8000)
  config =
    # Add a list of all the sails.js modules (POJOs) you want to
    # convert into sails models (waterline collections) globals.
    models:['News', 'Tag', 'Image', 'NewsCategory', 'Gallery', 'Artist', 'User']

  waterlineLoader.init(models, done)

after (done)->
  @timeout(8000)
  waterlineLoader.teardown(done)
```

### Example 2

```coffee
# test/mochaBootstrap.coffee

waterlineLoader = require('waterlineLoader')

before (done)->
  @timeout(8000)
  config =
    connections:
      testMysqlServer:
        adapter: 'test-mysql',
        host: 'localhost',
        user: 'root',
        password: '',
        database: 'test_db'

    # This conf will be merged with all loaded models before converting it into a waterline collection
    defaultModelConf:
      connection: 'testMysqlServer'

    # This syntax allows to apply a filter fn to the loaded module, this is
    # useful if you are using a dependency injection system like commonjs-injector
    # You can mix the syntax from the previous example and this one if you wish.
    models: [
      'News',
      {
        fileName: 'Image',
        afterLoadFilter: (injector)->
          injector({thumbnails: require("#{CWD}/test/mocks/thumbnails")})
      },
      'NewsCategory',
      'Gallery',
      'Artist',
      'User'
    ]

  waterlineLoader.init(models, done)

after (done)->
  @timeout(8000)
  waterlineLoader.teardown(done)
```