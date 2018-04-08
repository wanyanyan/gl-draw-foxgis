var events = require('./events');
var Store = require('./store');
var ui = require('./ui');
var Constants = require('./constants');

module.exports = function(ctx) {

  ctx.events = events(ctx);

  ctx.map = null;
  ctx.container = null;
  ctx.store = null;
  ctx.ui = ui(ctx);
  ctx.transform = 1;

  var controlContainer = null;
  var setup = {
    onRemove: function() {
      setup.removeLayers();
      ctx.ui.removeButtons();
      ctx.events.removeEventListeners();
      ctx.map = null;
      ctx.container = null;
      ctx.store = null;

      if (controlContainer && controlContainer.parentNode) controlContainer.parentNode.removeChild(controlContainer);
      controlContainer = null;
      return this;
    },
    onAdd: function(map) {
      ctx.map = map;
      ctx.container = map.getContainer();
      ctx.store = new Store(ctx);

      controlContainer = ctx.ui.addButtons();

      if (ctx.options.boxSelect) {
        map.boxZoom.disable();
        const dragPanState = map.dragPan.isEnabled();
        // Need to toggle dragPan on and off or else first
        // dragPan disable attempt in simple_select doesn't work
        map.dragPan.disable();
        map.dragPan.enable();
        if (!dragPanState) {
          map.dragPan.disable();
        }
      }

      var intervalId = null;
      const connect = function(){
        map.off('load', connect);
        clearInterval(intervalId);
        setup.addLayers();
        ctx.events.addEventListeners();
      };
      if (map.loaded()) {
        connect();
      } else {
        map.on('load', connect);
        intervalId = setInterval(function() { if (map.loaded()) connect(); }, 16);
      }
      return controlContainer;
    },
    addLayers: function() {
      // drawn features style
      ctx.map.addSource(Constants.sources.COLD, {
        data: {
          type: Constants.geojsonTypes.FEATURE_COLLECTION,
          features: []
        },
        type: 'geojson',
        projection: ctx.map._projection || 'EPSG:3857'
      });

      // hot features style
      ctx.map.addSource(Constants.sources.HOT, {
        data: {
          type: Constants.geojsonTypes.FEATURE_COLLECTION,
          features: []
        },
        type: 'geojson',
        projection: ctx.map._projection || 'EPSG:3857'
      });

      ctx.options.styles.forEach(function(style){
        ctx.map.addLayer(style);
      });

      ctx.store.render();
    },
    removeLayers: function() {
      ctx.options.styles.forEach(function(style){
        ctx.map.removeLayer(style.id);
      });

      ctx.map.removeSource(Constants.sources.COLD);
      ctx.map.removeSource(Constants.sources.HOT);
    }
  };

  ctx.setup = setup;
  return setup;
};
