const CommonSelectors = require('../lib/common_selectors');
const Arc = require('../feature_types/arc');
const isEventAtCoordinates = require('../lib/is_event_at_coordinates');
const doubleClickZoom = require('../lib/double_click_zoom');
const Constants = require('../constants');
const createVertex = require('../lib/create_vertex');

module.exports = function(ctx) {
  const arc = new Arc(ctx, {
    type: Constants.geojsonTypes.FEATURE,
    properties: {
      type:Constants.featureTypes.ARC
    },
    geometry: {
      type: Constants.geojsonTypes.LINE_STRING,
      coordinates: []
    }
  });
  var currentVertexPosition = 0;
  var points = [];

  if (ctx._test) ctx._test.line = arc;

  ctx.store.add(arc);

  return {
    start: function() {
      ctx.store.clearSelected();
      doubleClickZoom.disable(ctx);
      ctx.ui.queueMapClasses({ mouse: Constants.cursors.ADD });
      ctx.ui.setActiveButton(Constants.types.LINE);
      this.on('mousemove', CommonSelectors.true, function(e){
        if(currentVertexPosition === 2){
          var arcVertex = arc.getArcVertex(ctx,points[0],points[1],ctx.map.project(e.lngLat));
          if(arcVertex){
            arc.setCoordinates(arcVertex);
          }
        }else if(currentVertexPosition === 3){//结束
          ctx.map.fire(Constants.events.CREATE, {
            features: [arc.toGeoJSON()]
          });
          ctx.events.changeMode(Constants.modes.SIMPLE_SELECT, { featureIds: [arc.id] });
        }else if(currentVertexPosition === 1){
          arc.updateCoordinate(currentVertexPosition, e.lngLat.lng, e.lngLat.lat);
        }
        if (CommonSelectors.isVertex(e)) {
          ctx.ui.queueMapClasses({ mouse: Constants.cursors.POINTER });
        }
      });
      this.on('click', CommonSelectors.true, function(e){
        if(currentVertexPosition > 0 && isEventAtCoordinates(e, arc.coordinates[currentVertexPosition - 1])) {
          return ctx.events.changeMode(Constants.modes.SIMPLE_SELECT, { featureIds: [arc.id] });
        }
        ctx.ui.queueMapClasses({ mouse: Constants.cursors.ADD });
        if(currentVertexPosition===2){
          currentVertexPosition++;
        }else{
          arc.updateCoordinate(currentVertexPosition, e.lngLat.lng, e.lngLat.lat);
          points.push(ctx.map.project(e.lngLat));
          currentVertexPosition++;
        } 
      });
      this.on('click', CommonSelectors.isVertex, function(){
        return ctx.events.changeMode(Constants.modes.SIMPLE_SELECT, { featureIds: [arc.id] });
      });
      this.on('keyup', CommonSelectors.isEscapeKey, function(){
        ctx.store.delete([arc.id], { silent: true });
        ctx.events.changeMode(Constants.modes.SIMPLE_SELECT);
      });
      this.on('keyup', CommonSelectors.isEnterKey, function(){
        ctx.events.changeMode(Constants.modes.SIMPLE_SELECT, { featureIds: [arc.id] });
      });
      ctx.events.actionable({
        combineFeatures: false,
        uncombineFeatures: false,
        trash: true
      });
    },

    stop:function(){
      doubleClickZoom.enable(ctx);
      ctx.ui.setActiveButton();

      // check to see if we've deleted this feature
      if (ctx.store.get(arc.id) === undefined) return;

      //remove last added coordinate
      arc.removeCoordinate(String(currentVertexPosition));
      if (arc.isValid()) {
        ctx.map.fire(Constants.events.CREATE, {
          features: [arc.toGeoJSON()]
        });
      }
      else {
        ctx.store.delete([arc.id], { silent: true });
        ctx.events.changeMode(Constants.modes.SIMPLE_SELECT, {}, { silent: true });
      }
    },

    render:function(geojson, callback){
      const isActiveLine = geojson.properties.id === arc.id;
      geojson.properties.active = (isActiveLine) ? Constants.activeStates.ACTIVE : Constants.activeStates.INACTIVE;
      if (!isActiveLine) return callback(geojson);

      // Only render the line if it has at least one real coordinate
      if (geojson.geometry.coordinates.length < 2) return;
      geojson.properties.meta = Constants.meta.FEATURE;

      /*if(geojson.geometry.coordinates.length >= 3) {
        callback(createVertex(arc.id, geojson.geometry.coordinates[geojson.geometry.coordinates.length-2], String(geojson.geometry.coordinates.length-2), false));
      }*/

      callback(geojson);
    },

    trash:function(){
      ctx.store.delete([arc.id], { silent: true });
      ctx.events.changeMode(Constants.modes.SIMPLE_SELECT);
    }
  };
};

