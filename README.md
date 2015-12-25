# waterline-loader
A module to load waterline Collections and turn them into globals, mainly for unit testing sails.js


### Usage Example


```javascript
// test/mochaBootstrap.js

var waterlineLoader = require('waterlineLoader');

before(function(done){
  this.timeout(8000);
  // Add a list of all the sails.js modules (plain objects) you want to
  // convert into sails models (waterline collections) globals.
  var config = {models: ['News', 'Tag', 'Image', 'NewsCategory', 'Gallery', 'Artist', 'User']}  

  waterlineLoader.init(models, done);
});  

after(function(done){
  @timeout(8000)
  waterlineLoader.teardown(done);
});  
```

### Example 2

```javascript
// test/mochaBootstrap.js

var waterlineLoader = require('waterlineLoader')

before(function(done){
  this.timeout(8000)
  global.sails = {models: {}}
  var config = {
    connections: {
      testMysqlServer:
        adapter: 'test-mysql',
        host: 'localhost',
        user: 'root',
        password: '',
        database: 'test_db'
      },
        

    //This conf will be merged with all loaded models before converting it into a waterline collection
    defaultModelConf: {connection: 'testMysqlServer'},
      

    // This syntax allows to apply a filter fn to the loaded module, this is
    // useful if you are using a dependency injection system like commonjs-injector
    // You can mix the syntax from the previous example and this one if you wish.
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
    ],
    // Here you can specify where the models list will live, if you don't provide anything,
    // it will be attached to global. You can pass either an object or an array of objects
    attachModelsTo: [global, global.sails.models] // defaults to attachModelsTo: global
  };
  
  waterlineLoader.init(models, done);
});  

after(function(done){
  this.timeout(8000);
  waterlineLoader.teardown(done);
});  
  
```

Then just use your model globals as you would if you were lifting sails for testing