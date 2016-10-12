(function() {
  var CWD, Waterline, def, loadedModels, memoryAdapter, orm, waterlineLoader, _;

  _ = require('lodash');

  Waterline = require('waterline');

  def = require('def-type');

  memoryAdapter = require('sails-memory');

  orm = new Waterline();

  loadedModels = null;

  CWD = process.cwd();

  waterlineLoader = def.Module(function() {
    var config, defaultModel, namesHashMap, _destroyModel, _getOriginalName, _loadModelIntoCollection, _loadModels;
    config = {
      adapters: {
        'default': memoryAdapter,
        'memory': memoryAdapter
      },
      connections: {
        memory: {
          adapter: 'memory'
        }
      },
      defaults: {
        migrate: 'drop'
      },
      lookUpPath: "" + CWD + "/api/models",
      defaultModelConf: {
        connection: 'memory'
      },
      useLog: true
    };
    namesHashMap = {};
    defaultModel = null;
    this.init = function(options, callback) {
      var attachModelsTo, models;
      if (options == null) {
        options = {};
      }
      models = options.models || options.collections;
      delete options.models;
      delete options.collections;
      config = _.defaults(options, config);
      defaultModel = config.defaultModelConf;
      attachModelsTo = config.attachModelsTo != null ? _.isArray(config.attachModelsTo) ? config.attachModelsTo : [config.attachModelsTo] : [global];
      delete config.defaultModelConf;
      _loadModels(models);
      return orm.initialize(config, function(err, orm) {
        var lowerCaseName, model, obj, _i, _len, _ref;
        if (config.useLog) {
          console.log('WaterlineLoader: Initializing ORM');
        }
        if (err) {
          return callback(err);
        }
        loadedModels = orm.collections;
        _ref = orm.collections;
        for (lowerCaseName in _ref) {
          model = _ref[lowerCaseName];
          model.associations = _.reduce(model.attributes, function(associatedWith, attrDef, attrName) {
            var assoc, _ref1;
            if (typeof attrDef === 'object' && (attrDef.model || attrDef.collection)) {
              assoc = {
                alias: attrName,
                type: (_ref1 = attrDef.model) != null ? _ref1 : {
                  'model': 'collection'
                }
              };
              if (attrDef.model) {
                assoc.model = attrDef.model;
              }
              if (attrDef.collection) {
                assoc.collection = attrDef.collection;
              }
              if (attrDef.via) {
                assoc.via = attrDef.via;
              }
              associatedWith.push(assoc);
            }
            return associatedWith;
          }, []);
          if (lowerCaseName.indexOf('__') === -1) {
            for (_i = 0, _len = attachModelsTo.length; _i < _len; _i++) {
              obj = attachModelsTo[_i];
              obj[_getOriginalName(lowerCaseName)] = model;
            }
          }
        }
        return callback(orm.collections);
      });
    };
    this.teardown = function(callback) {
      if (config.useLog) {
        console.log('WaterlineLoader: tearing down...');
      }
      return _destroyModel(loadedModels, _.keys(loadedModels), callback);
    };
    _destroyModel = function(models, modelNamesArray, callback) {
      return models[modelNamesArray.pop()].destroy().then((function(_this) {
        return function() {
          if (modelNamesArray.length === 0) {
            return orm.teardown(callback);
          } else {
            return _destroyModel(models, modelNamesArray, callback);
          }
        };
      })(this));
    };
    _loadModels = function(models) {
      var model, modelDefinition, modelFileName, modelName, _i, _len;
      for (_i = 0, _len = models.length; _i < _len; _i++) {
        model = models[_i];
        modelFileName = _.isString(model) ? model : model.fileName || model.path;
        modelName = model.alias || modelFileName;
        modelDefinition = require("" + config.lookUpPath + "/" + modelFileName);
        if (_.isFunction(modelDefinition)) {
          if (model.afterLoadFilter != null) {
            modelDefinition = model.afterLoadFilter(modelDefinition);
          } else {
            modelDefinition = modelDefinition();
          }
        }
        _loadModelIntoCollection({
          name: modelName,
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
  });

  module.exports = waterlineLoader;

}).call(this);
