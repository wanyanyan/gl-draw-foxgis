const CommonSelectors = require('../lib/common_selectors');
const LineString = require('../feature_types/line_string');
const Point = require('../feature_types/point');
const isEventAtCoordinates = require('../lib/is_event_at_coordinates');
const doubleClickZoom = require('../lib/double_click_zoom');
const Constants = require('../constants');
const createVertex = require('../lib/create_vertex');

module.exports = function(ctx) {
  const point = new Point(ctx, {
    type: Constants.geojsonTypes.FEATURE,
    properties: {
      type: Constants.featureTypes.LABEL_WITH_LINE,
      mode: Constants.modes.DRAW_LINE_WITH_LABEL
    },
    geometry: {
      type: Constants.geojsonTypes.POINT,
      coordinates: []
    }
  });
  const line = new LineString(ctx, {
    type: Constants.geojsonTypes.FEATURE,
    properties: {
      type:Constants.featureTypes.LABEL_WITH_LINE,
      mode: Constants.modes.DRAW_LINE_WITH_LABEL
    },
    geometry: {
      type: Constants.geojsonTypes.LINE_STRING,
      coordinates: []
    }
  });
  point.properties.associatedFeatureId = line.id;
  line.properties.associatedFeatureId = point.id;
  var currentVertexPosition = 0;

  if (ctx._test) ctx._test.line = line;
  if (ctx._test) ctx._test.point = point;

  ctx.store.add(line);
  ctx.store.add(point);

  return {
    start: function() {
      ctx.store.clearSelected();
      doubleClickZoom.disable(ctx);
      ctx.ui.queueMapClasses({ mouse: Constants.cursors.ADD });
      ctx.ui.setActiveButton(Constants.types.LINE);
      this.on('mousemove', CommonSelectors.true, function(e){
        line.updateCoordinate(currentVertexPosition, e.lngLat.lng, e.lngLat.lat);
        if(currentVertexPosition === 1) {
          point.updateCoordinate('', e.lngLat.lng, e.lngLat.lat);
          ctx.map.fire('draw.labelpoint.drag', {
            feature: point
          });
        }else if(currentVertexPosition === 2){//结束
          ctx.map.fire(Constants.events.CREATE, {
            features: [point.toGeoJSON(), line.toGeoJSON()]
          });
          ctx.events.changeMode(Constants.modes.SIMPLE_SELECT, { featureIds: [point.id, line.id] });
          line.properties.mode = Constants.modes.SIMPLE_SELECT;
          point.properties.mode = Constants.modes.SIMPLE_SELECT;
        }
        if (CommonSelectors.isVertex(e)) {
          ctx.ui.queueMapClasses({ mouse: Constants.cursors.POINTER });
        }
      });
      this.on('click', CommonSelectors.true, function(e){
        if(currentVertexPosition > 0 && isEventAtCoordinates(e, line.coordinates[currentVertexPosition - 1])) {
          return ctx.events.changeMode(Constants.modes.SIMPLE_SELECT, { featureIds: [point.id, line.id] });
        }
        ctx.ui.queueMapClasses({ mouse: Constants.cursors.ADD });
        line.updateCoordinate(currentVertexPosition, e.lngLat.lng, e.lngLat.lat);
        currentVertexPosition++;
      });
      this.on('click', CommonSelectors.isVertex, function(){
        return ctx.events.changeMode(Constants.modes.SIMPLE_SELECT, { featureIds: [point.id, line.id] });
      });
      this.on('keyup', CommonSelectors.isEscapeKey, function(){
        ctx.store.delete([line.id, point.id], { silent: true });
        ctx.events.changeMode(Constants.modes.SIMPLE_SELECT);
      });
      this.on('keyup', CommonSelectors.isEnterKey, function(){
        ctx.events.changeMode(Constants.modes.SIMPLE_SELECT, { featureIds: [point.id, line.id] });
      });
      ctx.events.actionable({
        combineFeatures: false,
        uncombineFeatures: false,
        trash: true
      });
    },

    stop:function(){
      var initialDoubleClickZoomState = ctx.map ? ctx.map.doubleClickZoom.isEnabled() : true;
      doubleClickZoom.enable(ctx);
      ctx.ui.setActiveButton();

      // check to see if we've deleted this feature
      if (ctx.store.get(line.id) === undefined) return;

      //remove last added coordinate
      line.removeCoordinate(String(currentVertexPosition));
      if (line.isValid()) {
        ctx.map.fire(Constants.events.CREATE, {
          features: [point.toGeoJSON(), line.toGeoJSON()]
        });
      } else {
        ctx.store.delete([line.id, point.id], { silent: true });
        ctx.events.changeMode(Constants.modes.SIMPLE_SELECT, {}, { silent: true });
      }
    },

    render:function(geojson, callback){
      const isActiveLine = geojson.properties.id === line.id;
      geojson.properties.active = (isActiveLine) ? Constants.activeStates.ACTIVE : Constants.activeStates.INACTIVE;
      if (!isActiveLine) return callback(geojson);

      // Only render the line if it has at least one real coordinate
      if (geojson.geometry.coordinates.length < 2) return;
      geojson.properties.meta = Constants.meta.FEATURE;

      if(geojson.geometry.coordinates.length >= 3) {
        callback(createVertex(line.id, geojson.geometry.coordinates[geojson.geometry.coordinates.length-2], String(geojson.geometry.coordinates.length-2), false));
      }

      callback(geojson);
    },

    trash:function(){
      ctx.store.delete([line.id], { silent: true });
      ctx.events.changeMode(Constants.modes.SIMPLE_SELECT);
    }
  };
};
