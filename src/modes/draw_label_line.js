const CommonSelectors = require('../lib/common_selectors');
const BezierSpline = require('../feature_types/bezier_spline');
const isEventAtCoordinates = require('../lib/is_event_at_coordinates');
const doubleClickZoom = require('../lib/double_click_zoom');
const Constants = require('../constants');
const createVertex = require('../lib/create_vertex');

module.exports = function(ctx) {
  const bezier = new BezierSpline(ctx, {
    type: Constants.geojsonTypes.FEATURE,
    properties: {
      type:Constants.featureTypes.LABEL_LINE
    },
    geometry: {
      type: Constants.geojsonTypes.LINE_STRING,
      coordinates: []
    }
  });
  var currentVertexPosition = 0;
  var stableVertex = []; //已经固定的曲线坐标
  var bezierVertex = []; //曲线所有的坐标
  //每点击一次，获取点击的坐标，只保存后三个点
  var points = new Array(3);

  if (ctx._test) ctx._test.line = bezier;

  ctx.store.add(bezier);

  return {
    start: function() {
      ctx.store.clearSelected();
      doubleClickZoom.disable(ctx);
      ctx.ui.queueMapClasses({ mouse: Constants.cursors.ADD });
      ctx.ui.setActiveButton(Constants.types.LINE);
      this.on('mousemove', CommonSelectors.true, function(e){
        if(currentVertexPosition >= 2){//两个点时计算Bezier曲线
          var p = ctx.map.project(e.lngLat);
          points[2] = ([p.x,p.y,0]);
          var vertex = bezier.getBezierVertex(ctx,points);
          if(vertex){
            bezierVertex = stableVertex.concat(vertex.section1).concat(vertex.section2);
            bezier.setCoordinates(bezierVertex);
          }
        }else if(currentVertexPosition === 1){
          bezier.updateCoordinate(currentVertexPosition, e.lngLat.lng, e.lngLat.lat);
        }
        if (CommonSelectors.isVertex(e)) {
          ctx.ui.queueMapClasses({ mouse: Constants.cursors.POINTER });
        }
      });
      this.on('click', CommonSelectors.true, function(e){
        if(currentVertexPosition == 0) {
          var layer1 = {
            'id': bezier.id + '_hot',
            'type': 'symbol',
            'filter': ["all",['==', 'type', 'label_line'], ["==","id",bezier.id]],
            'source':"mapbox-gl-draw-hot",
            "layout": {
              "symbol-placement": "line",
              "text-letter-spacing": 1,
              "symbol-spacing": 150,
              "text-field": "沿线标注",
              "text-font": [
                "SimHei Regular"
              ],
              "text-size": 14,
              "text-allow-overlap": true,
              "text-ignore-placement": true
            },
            "paint": {
              "text-color": "#ffff00"
            }
          }
          var layer2 = {
            'id': bezier.id + '_cold',
            'type': 'symbol',
            'filter': ["all",['==', 'type', 'label_line'], ["==","id",bezier.id]],
            'source':"mapbox-gl-draw-cold",
            "layout": {
              "symbol-placement": "line",
              "text-letter-spacing": 1,
              "symbol-spacing": 150,
              "text-field": "沿线标注",
              "text-font": [
                "SimHei Regular"
              ],
              "text-size": 14,
              "text-allow-overlap": true,
              "text-ignore-placement": true
            },
            "paint": {
              "text-color": "#ffff00"
            }
          }
          ctx.map.addLayer(layer1);
          ctx.map.addLayer(layer2);
        }
        if (currentVertexPosition >= 2 && isEventAtCoordinates(e, bezier.coordinates[bezierVertex.length - 1])) {
          return ctx.events.changeMode(Constants.modes.SIMPLE_SELECT, { featureIds: [bezier.id] });
        }
        ctx.ui.queueMapClasses({ mouse: Constants.cursors.ADD });
        if (currentVertexPosition < 2){
          bezier.updateCoordinate(currentVertexPosition, e.lngLat.lng, e.lngLat.lat);
        }else {
          bezier.updateCoordinate(bezierVertex.length - 1, e.lngLat.lng, e.lngLat.lat);
        }
        var p = ctx.map.project(e.lngLat);
        if(currentVertexPosition >= 2) {
          points[2] =  [p.x,p.y,0];
          var vertex = bezier.getBezierVertex(ctx,points);
          stableVertex = stableVertex.concat(vertex.section1);
        }
        if(points[1]) {
          points[0] = points[1];
        }
        points[1] = [p.x,p.y,0];

        currentVertexPosition++;
      });
      this.on('click', CommonSelectors.isVertex, function(){
        return ctx.events.changeMode(Constants.modes.SIMPLE_SELECT, { featureIds: [bezier.id] });
      });
      this.on('keyup', CommonSelectors.isEscapeKey, function(){
        ctx.store.delete([bezier.id], { silent: true });
        ctx.events.changeMode(Constants.modes.SIMPLE_SELECT);
      });
      this.on('keyup', CommonSelectors.isEnterKey, function(){
        ctx.events.changeMode(Constants.modes.SIMPLE_SELECT, { featureIds: [bezier.id] });
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
      if (ctx.store.get(bezier.id) === undefined) return;

      //remove last added coordinate
      bezier.removeCoordinate(String(currentVertexPosition));
      if (bezier.isValid()) {
        ctx.map.fire(Constants.events.CREATE, {
          features: [bezier.toGeoJSON()]
        });
      }
      else {
        ctx.store.delete([bezier.id], { silent: true });
        ctx.events.changeMode(Constants.modes.SIMPLE_SELECT, {}, { silent: true });
      }
    },

    render:function(geojson, callback){
      const isActiveLine = geojson.properties.id === bezier.id;
      geojson.properties.active = (isActiveLine) ? Constants.activeStates.ACTIVE : Constants.activeStates.INACTIVE;
      if (!isActiveLine) return callback(geojson);

      // Only render the line if it has at least one real coordinate
      if (geojson.geometry.coordinates.length < 2) return;
      geojson.properties.meta = Constants.meta.FEATURE;

      /*if(geojson.geometry.coordinates.length >= 3) {
        callback(createVertex(bezier.id, geojson.geometry.coordinates[geojson.geometry.coordinates.length-2], String(geojson.geometry.coordinates.length-2), false));
      }*/

      callback(geojson);
    },

    trash:function(){
      ctx.store.delete([bezier.id], { silent: true });
      ctx.events.changeMode(Constants.modes.SIMPLE_SELECT);
    }
  };
};

