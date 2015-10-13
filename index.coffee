_ = require('lodash')
Waterline = require('waterline')
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

      testMysqlServer:
        adapter: 'sails-mysql',
        host: 'localhost',
        user: 'root',
        password: '',
        database: 'test_artnexus'

      localDiskDb:
        adapter: 'sails-disk'

    defaults:
      migrate: 'drop'

  defaultModel =
    connection: 'testMysqlServer'

  #models = ['NewsEntry', 'News', 'Image']

  namesHashMap = {}

  @init = (models, done)->
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
        # We do not want to add association models (junction tables) to the global scope
        # so we make a little check, since those model names have a double underscore on them.
        if lowerCaseName.indexOf('__') is -1
          #console.log "Adding #{lowerCaseName} to the global scope"
          global[_getOriginalName(lowerCaseName)] = model
      done()

    @teardown = (done)->
      console.log 'WaterlineLoader: tearing down...'
      do async ->
        # Db Clean up
        for modelName, model of loadedModels
          await model.destroy()
        orm.teardown(done)

    _loadModels = (models)->
      for model in models
        modelDefinition = require("#{CWD}/api/models/#{model.fileName}")

        # Useful if sails models were define via commonjs-injector
        if _.isFunction(modelDefinition)
          if model.afterLoadFilter?
            modelDefinition = model.afterLoadFilter(modelDefinition)
          else
            modelDefinition = modelDefinition()

        _loadModelIntoCollection(name: model.fileName, definition: modelDefinition)
      return this

    _loadModelIntoCollection = (model)->
      waterlineModel = _.defaults(model.definition, {identity: model.name, tableName: model.name}, defaultModel)
      waterlineCollection = Waterline.Collection.extend(waterlineModel)
      orm.loadCollection(waterlineCollection)
      namesHashMap[model.name.toLowerCase()] = model.name

    _getOriginalName = (lowerCaseName)-> namesHashMap[lowerCaseName]

module.exports = waterlineLoader