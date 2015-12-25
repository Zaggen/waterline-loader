# Dependencies
_ = require('lodash')
Waterline = require('waterline')
def = require('def-type')

# Require any waterline compatible adapters here
memoryAdapter = require('sails-memory')
diskAdapter = require('sails-disk')
MySqlAdapter = require('sails-mysql')
# Instantiate a new instance of the ORM
orm = new Waterline()
loadedModels = null

# Paths
CWD = process.cwd()

waterlineLoader = def.Module ->
  #################################
  # WATERLINE CONFIG
  #################################

  # Build A Config Object
  config =
    # Setup Adapters
    # Creates named adapters that have have been required
    adapters:
      'default': memoryAdapter
      'memory': memoryAdapter
      'sails-disk': diskAdapter
      'sails-mysql': MySqlAdapter

    # Build Connections Config
    # Setup connections using the named adapter configs
    connections:
      memory:
        adapter: 'memory'

      localDiskDb:
        adapter: 'sails-disk'

    defaults:
      migrate: 'drop'

    defaultModelConf:
      connection: 'memory'

  namesHashMap = {}
  defaultModel = null

  @init = (options = {}, done)->
    models = options.models
    delete options.models
    config = _.merge(config, options)
    defaultModel = config.defaultModelConf
    attachModelsTo =
      if options.attachModelsTo?
        if _.isArray(options.attachModelsTo) then options.attachModelsTo else [options.attachModelsTo]
      else
        [global]
    delete config.defaultModelConf

    ####################################
    # START WATERLINE
    ####################################
    _loadModels(models)

    # Start Waterline passing adapters in
    orm.initialize config, (err, orm)->
      console.log 'WaterlineLoader: Initializing ORM'
      if(err) then throw err
      loadedModels = orm.collections # We want to manually remove all records later in the teardown

      for lowerCaseName, model of orm.collections
        # Bind context for models
        # (this (breaks?)allows usage with tools like `async`)
        #_.bindAll(thisModel);

        # Derive information about this model's associations from its schema
        # and attach/expose the metadata as `SomeModel.associations` (an array)
        # This allows us to use methods like .populateAll()
        model.associations = _.reduce( model.attributes,  (associatedWith, attrDef, attrName)->
          if typeof attrDef is 'object' && (attrDef.model or attrDef.collection)
            assoc =
              alias: attrName,
              type: attrDef.model ? 'model' : 'collection'
            if (attrDef.model)
              assoc.model = attrDef.model
            if (attrDef.collection)
              assoc.collection = attrDef.collection
            if (attrDef.via)
              assoc.via = attrDef.via
            associatedWith.push(assoc)
          return associatedWith
        , [])

        # We do not want to add association models (junction tables) to the global scope
        # so we make a little check, since those model names have a double underscore on them.
        if lowerCaseName.indexOf('__') is -1
          #console.log "Adding #{lowerCaseName} to the global scope"
          for obj in attachModelsTo
            obj[_getOriginalName(lowerCaseName)] = model
      done()

  @teardown = (done)->
    console.log 'WaterlineLoader: tearing down...'
    # This method calls itself until all models are destroyed
    _destroyModel(loadedModels, _.keys(loadedModels), done)


  _destroyModel = (models, modelNamesArray, done)->
    models[modelNamesArray.pop()].destroy().then =>
      if modelNamesArray.length is 0
        orm.teardown(done)
      else
        _destroyModel(models, modelNamesArray, done)

  _loadModels = (models)->
    for model in models
      # Models can be simple strings entries in the array, or objects
      modelFileName = if _.isString(model) then model else model.fileName
      modelDefinition = require("#{CWD}/api/models/#{modelFileName}")

      # Useful if sails models were define via commonjs-injector
      if _.isFunction(modelDefinition)
        if model.afterLoadFilter?
          modelDefinition = model.afterLoadFilter(modelDefinition)
        else
          modelDefinition = modelDefinition()

      _loadModelIntoCollection(name: modelFileName, definition: modelDefinition)
    return this

  _loadModelIntoCollection = (model)->
    waterlineModel = _.defaults(model.definition, {identity: model.name, tableName: model.name}, defaultModel)
    waterlineCollection = Waterline.Collection.extend(waterlineModel)
    orm.loadCollection(waterlineCollection)
    namesHashMap[model.name.toLowerCase()] = model.name

  _getOriginalName = (lowerCaseName)-> namesHashMap[lowerCaseName]

module.exports = waterlineLoader