const CommonSelectors = require('../lib/common_selectors');
const Rectangle = require('../feature_types/rectangle');
const doubleClickZoom = require('../lib/double_click_zoom');
const Constants = require('../constants');
const isEventAtCoordinates = require('../lib/is_event_at_coordinates');
const createVertex = require('../lib/create_vertex');

module.exports = function(ctx) {

  const rectangle = new Rectangle(ctx, {
    type: Constants.geojsonTypes.FEATURE,
    properties: {},
    geometry: {
      type: Constants.geojsonTypes.POLYGON,
      coordinates: [[]]
    }
  });
  var currentVertexPosition = 0;

  if (ctx._test) ctx._test.polygon = rectangle;

  ctx.store.add(rectangle);

  return {
    start:function(){
      ctx.store.clearSelected();
      doubleClickZoom.disable(ctx);
      ctx.ui.queueMapClasses({ mouse: Constants.cursors.ADD });
      this.on('mousemove', CommonSelectors.true, function(e){
        if(currentVertexPosition === 2){
          var coordinates = rectangle.coordinates[0];
          var rectVertex = rectangle.getRectVertex(ctx.map.project(coordinates[0]),ctx.map.project(coordinates[1]),ctx.map.project(e.lngLat));
          if(rectVertex){
            var p3 = ctx.map.unproject(rectVertex[2]);
            var p4 = ctx.map.unproject(rectVertex[3]);
            rectangle.updateCoordinate("0.2", p3.lng, p3.lat);
            rectangle.updateCoordinate("0.3", p4.lng, p4.lat);
          }
        }else if(currentVertexPosition === 4){
          ctx.map.fire(Constants.events.CREATE, {
            features: [rectangle.toGeoJSON()]
          });
          ctx.events.changeMode(Constants.modes.SIMPLE_SELECT, { featureIds: [rectangle.id] });
        }else{
          rectangle.updateCoordinate("0."+currentVertexPosition, e.lngLat.lng, e.lngLat.lat);
        }
        if (CommonSelectors.isVertex(e)) {
          ctx.ui.queueMapClasses({ mouse: Constants.cursors.POINTER });
        }
      });
      this.on('click', CommonSelectors.true, function(e){
        if (currentVertexPosition > 0 && isEventAtCoordinates(e, rectangle.coordinates[0][currentVertexPosition - 1])) {
          return ctx.events.changeMode(Constants.modes.SIMPLE_SELECT, { featureIds: [rectangle.id] });
        }
        ctx.ui.queueMapClasses({ mouse: Constants.cursors.ADD });
        if(currentVertexPosition < 2){
          rectangle.updateCoordinate("0."+currentVertexPosition, e.lngLat.lng, e.lngLat.lat);
          currentVertexPosition++;
        }else{
          currentVertexPosition = 4;
        } 
      });
      this.on('click', CommonSelectors.isVertex, function(){
        return ctx.events.changeMode(Constants.modes.SIMPLE_SELECT, { featureIds: [rectangle.id] });
      });
      this.on('keyup', CommonSelectors.isEscapeKey, function(){
        ctx.store.delete([rectangle.id], { silent: true });
        ctx.events.changeMode(Constants.modes.SIMPLE_SELECT);
      });
      this.on('keyup', CommonSelectors.isEnterKey, function(){
        ctx.events.changeMode(Constants.modes.SIMPLE_SELECT, { featureIds: [rectangle.id] });
      });
      ctx.events.actionable({
        combineFeatures: false,
        uncombineFeatures: false,
        trash: true
      });
    },

    stop: function() {
      ctx.ui.queueMapClasses({ mouse: Constants.cursors.NONE });
      var initialDoubleClickZoomState = ctx.map ? ctx.map.doubleClickZoom.isEnabled() : true;
      doubleClickZoom.enable(ctx);
      ctx.ui.setActiveButton();

      // check to see if we've deleted this feature
      if (ctx.store.get(rectangle.id) === undefined) return;

      //remove last added coordinate
      rectangle.removeCoordinate("0."+currentVertexPosition);
      if (rectangle.isValid()) {
        ctx.map.fire(Constants.events.CREATE, {
          features: [rectangle.toGeoJSON()]
        });
      }
      else {
        ctx.store.delete([rectangle.id], { silent: true });
        ctx.events.changeMode(Constants.modes.SIMPLE_SELECT, {}, { silent: true });
      }
    },

    render:function(geojson, callback) {
      const isActivePolygon = geojson.properties.id === rectangle.id;
      geojson.properties.active = (isActivePolygon) ? Constants.activeStates.ACTIVE : Constants.activeStates.INACTIVE;
      if (!isActivePolygon) return callback(geojson);

      // Don't render a polygon until it has two positions
      // (and a 3rd which is just the first repeated)
      if (geojson.geometry.coordinates.length === 0) return;

      const coordinateCount = geojson.geometry.coordinates[0].length;

      // If we have fewer than two positions (plus the closer),
      // it's not yet a shape to render
      if (coordinateCount < 3) return;

      geojson.properties.meta = Constants.meta.FEATURE;

      /*if (coordinateCount > 4) {
        // Add a start position marker to the map, clicking on this will finish the feature
        // This should only be shown when we're in a valid spot
        callback(createVertex(rectangle.id, geojson.geometry.coordinates[0][0], '0.0', false));
        var endPos = geojson.geometry.coordinates[0].length - 3;
        callback(createVertex(rectangle.id, geojson.geometry.coordinates[0][endPos], "0."+endPos, false));
      }*/

      // If we have more than two positions (plus the closer),
      // render the Polygon
      if (coordinateCount > 3) {
        return callback(geojson);
      }

      // If we've only drawn two positions (plus the closer),
      // make a LineString instead of a Polygon
      const lineCoordinates = [
        [geojson.geometry.coordinates[0][0][0], geojson.geometry.coordinates[0][0][1]], [geojson.geometry.coordinates[0][1][0], geojson.geometry.coordinates[0][1][1]]
      ];
      return callback({
        type: Constants.geojsonTypes.FEATURE,
        properties: geojson.properties,
        geometry: {
          coordinates: lineCoordinates,
          type: Constants.geojsonTypes.LINE_STRING
        }
      });
    },
    trash:function() {
      ctx.store.delete([rectangle.id], { silent: true });
      ctx.events.changeMode(Constants.modes.SIMPLE_SELECT);
    }
  };
};
