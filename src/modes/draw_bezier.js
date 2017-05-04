const CommonSelectors = require('../lib/common_selectors');
const Bezier = require('../feature_types/bezier');
const isEventAtCoordinates = require('../lib/is_event_at_coordinates');
const doubleClickZoom = require('../lib/double_click_zoom');
const Constants = require('../constants');
const createVertex = require('../lib/create_vertex');

module.exports = function(ctx) {
  const bezier = new Bezier(ctx, {
    type: Constants.geojsonTypes.FEATURE,
    properties: {},
    geometry: {
      type: Constants.geojsonTypes.LINE_STRING,
      coordinates: []
    }
  });
  var currentVertexPosition = 0;
  //每点击一次，获取点击的坐标，x、y分开存储
  var points_x = new Array(3);
  var points_y = new Array(3);

  if (ctx._test) ctx._test.line = bezier;

  ctx.store.add(bezier);

  return {
    start: function() {
      ctx.store.clearSelected();
      doubleClickZoom.disable(ctx);
      ctx.ui.queueMapClasses({ mouse: Constants.cursors.ADD });
      ctx.ui.setActiveButton(Constants.types.LINE);
      this.on('mousemove', CommonSelectors.true, function(e){
        if(currentVertexPosition === 2){//两个点时计算Bezier曲线
          var p = ctx.map.project(e.lngLat);
          points_x[1] = p.x;
          points_y[1] = p.y;
          var bezierVertex = bezier.getBezierVertex(ctx,points_x,points_y);
          if(bezierVertex){
            bezier.setCoordinates(bezierVertex);
          }
        }else if(currentVertexPosition === 3){//三个点时绘制完毕
          ctx.map.fire(Constants.events.CREATE, {
            features: [bezier.toGeoJSON()]
          });
          ctx.events.changeMode(Constants.modes.SIMPLE_SELECT, { featureIds: [bezier.id] });
        }else if(currentVertexPosition === 1){
          bezier.updateCoordinate(currentVertexPosition, e.lngLat.lng, e.lngLat.lat);
        }
        if (CommonSelectors.isVertex(e)) {
          ctx.ui.queueMapClasses({ mouse: Constants.cursors.POINTER });
        }
      });
      this.on('click', CommonSelectors.true, function(e){
        if (currentVertexPosition > 0 && isEventAtCoordinates(e, bezier.coordinates[currentVertexPosition - 1])) {
          return ctx.events.changeMode(Constants.modes.SIMPLE_SELECT, { featureIds: [bezier.id] });
        }
        ctx.ui.queueMapClasses({ mouse: Constants.cursors.ADD });
        if (currentVertexPosition < 2){
          bezier.updateCoordinate(currentVertexPosition, e.lngLat.lng, e.lngLat.lat);
        }
        var p = ctx.map.project(e.lngLat);
        if (currentVertexPosition === 0) {//第一个点，起点
          points_x[0] = p.x;
          points_y[0] = p.y;
        } else if (currentVertexPosition === 1) {//第二个点，终点
          points_x[2] = p.x;
          points_y[2] = p.y;
        } else if (currentVertexPosition === 2) {//第三个点
          points_x[1] = p.x;
          points_y[1] = p.y;
        }
        /*points_x[currentVertexPosition] = p.x;
        points_y[currentVertexPosition] = p.y;
        points_x.pop();points_y.pop();
        points_x.push(p.x);
        points_y.push(p.y);
        points_x.push(0);
        points_y.push(0);*/
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

