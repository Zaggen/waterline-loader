# waterline-loader
A module to load waterline Collections and turn them into globals, mainly for unit testing sails.js

### API
`.init(config = {}, callback)`
- ***config:***
Pass an object to configure the module, it accepts the following properties:

  - `models` (Array: [String | Object]): Here you define the collections you want
  to load into waterline, defined by either its fileName as a string, or an object in
  case you want do do some processing after the object is loaded, this is usefull for
  unit testing. Please note that each model should be defined as an object literal, just
  as we define models in sails js and they are expected to be store on `api/models` path.
  e.g: `{models: ['News', 'Tag']}`
  - `collections` (Array: [String | Object]): This is just an alias for models, since waterline
  uses the word collections, and sails uses models, you can use whichever you see fit to your project.
  - `adapters` (Object {'adapterName': Adapter}): Here you specify the adapters you want to use. This
  property if defined, will be merged with the following defaults:

    ```{
       'default': memoryAdapter,
       'memory': memoryAdapter,
       'sails-disk': diskAdapter,
       'sails-mysql': MySqlAdapter
    }```
  
  - `connections` (Object {'connectionName': {adapter: 'adapterName'}}): Define your custom connections here,
  or leave it blank to use the defaults ```{memory: {adapter: 'memory'}, localDiskDb: {adapter: 'sails-disk'}```
  - `defaultModelConf` (Object): Here you specify the defaults for all your models, this is specially useful when
  you are also setting custom connections, so you can link them to your models, like this `{connection: 'memory'}`
  - `lookUpPath` (String): In Case you have a different folder structure that what sails uses (`CWD + '/api/models'`),
  you can specify that here, so all models/collections will be searched on the specified path, e.g `CWD + '/collections'`
  - `useLog` (Boolean): Shows a couple of logs if set to true
  
- ***callback:***: The function that will be called once the models/collections are properly parsed and loaded into
waterline

`.teardown(callback)`
- ***callback:***: The function that will be called once the models/collections are properly parsed and loaded into
waterline

### Usage Example


```javascript
// test/mochaBootstrap.js

var waterlineLoader = require('waterlineLoader');

before(function(done){
  this.timeout(8000);
  // Add a list of all the sails.js modules (plain objects) you want to
  // convert into sails models (waterline collections) globals.
  var config = {models: ['News', 'Tag', 'Image', 'NewsCategory', 'Gallery', 'Artist', 'User']}  

  waterlineLoader.init(config, done);
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
  
  waterlineLoader.init(config, done);
});  

after(function(done){
  this.timeout(8000);
  waterlineLoader.teardown(done);
});  
  
```

Then just use your model globals as you would if you were lifting sails for testing

Note: If your models have associations between each other, you must include all related models/collections
in the passed list, so waterline can build the relationships.