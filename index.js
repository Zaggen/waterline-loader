// Generated by CoffeeScript 1.9.3
(function() {
  var CWD, MySqlAdapter, Waterline, _, def, diskAdapter, loadedModels, memoryAdapter, orm, waterlineLoader;

  _ = require('lodash');

  Waterline = require('waterline');

  def = require('def-inc');

  memoryAdapter = require('sails-memory');

  diskAdapter = require('sails-disk');

  MySqlAdapter = require('sails-mysql');

  orm = new Waterline();

  loadedModels = null;

  CWD = process.cwd();

  waterlineLoader = def.Module(function() {
    var config, defaultModel, namesHashMap;
    config = {
      adapters: {
        'default': memoryAdapter,
        'memory': memoryAdapter,
        'sails-disk': diskAdapter,
        'sails-mysql': MySqlAdapter
      },
      connections: {
        memory: {
          adapter: 'memory'
        },
        localDiskDb: {
          adapter: 'sails-disk'
        }
      },
      defaults: {
        migrate: 'drop'
      }
    };
    defaultModel = {
      connection: 'testMysqlServer'
    };
    namesHashMap = {};
    return this.init = function(options, done) {
      var _destroyModel, _getOriginalName, _loadModelIntoCollection, _loadModels, models;
      if (options == null) {
        options = {};
      }
      models = options.models;
      delete options.models;
      config = _.extend(config, options);
      _loadModels(models);
      orm.initialize(config, function(err, orm) {
        var lowerCaseName, model, ref;
        console.log('WaterlineLoader: Initializing ORM');
        if (err) {
          throw err;
        }
        loadedModels = orm.collections;
        ref = orm.collections;
        for (lowerCaseName in ref) {
          model = ref[lowerCaseName];
          if (lowerCaseName.indexOf('__') === -1) {
            global[_getOriginalName(lowerCaseName)] = model;
          }
        }
        return done();
      });
      this.teardown = function(done) {
        console.log('WaterlineLoader: tearing down...');
        return _destroyModel(loadedModels, _.keys(loadedModels), done);
      };
      _destroyModel = function(models, modelNamesArray, done) {
        return models[modelNamesArray.pop()].destroy().then((function(_this) {
          return function() {
            if (modelNamesArray.length === 0) {
              return orm.teardown(done);
            } else {
              return _destroyModel(models, modelNamesArray, done);
            }
          };
        })(this));
      };
      _loadModels = function(models) {
        var i, len, model, modelDefinition, modelFileName;
        for (i = 0, len = models.length; i < len; i++) {
          model = models[i];
          modelFileName = _.isString(model) ? model : model.fileName;
          modelDefinition = require(CWD + "/api/models/" + modelFileName);
          if (_.isFunction(modelDefinition)) {
            if (model.afterLoadFilter != null) {
              modelDefinition = model.afterLoadFilter(modelDefinition);
            } else {
              modelDefinition = modelDefinition();
            }
          }
          _loadModelIntoCollection({
            name: modelFileName,
            definition: modelDefinition
          });
        }
        return this;
      };
      _loadModelIntoCollection = function(model) {
        var waterlineCollection, waterlineModel;
        waterlineModel = _.defaults(model.definition, {
          identity: model.name,
          tableName: model.name
        }, defaultModel);
        waterlineCollection = Waterline.Collection.extend(waterlineModel);
        orm.loadCollection(waterlineCollection);
        return namesHashMap[model.name.toLowerCase()] = model.name;
      };
      return _getOriginalName = function(lowerCaseName) {
        return namesHashMap[lowerCaseName];
      };
    };
  });

  module.exports = waterlineLoader;

}).call(this);

//# sourceMappingURL=index.js.map
