const CommonSelectors = require('../lib/common_selectors');
const mouseEventPoint = require('../lib/mouse_event_point');
const featuresAt = require('../lib/features_at');
const createSupplementaryPoints = require('../lib/create_supplementary_points');
const createControlFeature = require('../lib/create_control_feature');
const StringSet = require('../lib/string_set');
const doubleClickZoom = require('../lib/double_click_zoom');
const moveFeatures = require('../lib/move_features');
const transformFeatures = require('../lib/transform_features');
const Constants = require('../constants');
const MultiFeature = require('../feature_types/multi_feature');
var geojsonExtent = require('geojson-extent');

module.exports = function(ctx, options) {
  if(options===undefined){options={};}
  var dragMoveLocation = null;
  var boxSelectStartLocation = null;
  var boxSelectElement;
  var boxSelecting = false;
  var canBoxSelect = false;
  var dragMoving = false;
  var canDragMove = false;
  var transformTarget = null;
  var initialDragPanState = ctx.map ? ctx.map.dragPan.isEnabled() : true;

  var location = '';

  const initiallySelectedFeatureIds = options.featureIds || [];

  const fireUpdate = function() {
    ctx.map.fire(Constants.events.UPDATE, {
      action: Constants.updateActions.MOVE,
      features: ctx.store.getSelected().map(function(f){return f.toGeoJSON()})
    });
  };

  const fireActionable = function() {
    const selectedFeatures = ctx.store.getSelected();

    const multiFeatures = selectedFeatures.filter(
      function(feature){return feature instanceof MultiFeature;}
    );

    var combineFeatures = false;

    if (selectedFeatures.length > 1) {
      combineFeatures = true;
      const featureType = selectedFeatures[0].type.replace('Multi', '');
      selectedFeatures.forEach(function(feature) {
        if (feature.type.replace('Multi', '') !== featureType) {
          combineFeatures = false;
        }
      });
    }

    const uncombineFeatures = multiFeatures.length > 0;
    const trash = selectedFeatures.length > 0;

    ctx.events.actionable({
      combineFeatures:combineFeatures, uncombineFeatures:uncombineFeatures, trash:trash
    });
  };

  const getUniqueIds = function(allFeatures) {
    if (!allFeatures.length) return [];
    const ids = allFeatures.map(function(s){return s.properties.id})
      .filter(function(id){return id !== undefined})
      .reduce(function(memo, id){
        memo.add(id);
        return memo;
      }, new StringSet());

    return ids.values();
  };

  const stopExtendedInteractions = function() {
    if (boxSelectElement) {
      if (boxSelectElement.parentNode) boxSelectElement.parentNode.removeChild(boxSelectElement);
      boxSelectElement = null;
    }

    if ((canDragMove || canBoxSelect) && initialDragPanState === true) {
      ctx.map.dragPan.enable();
    }

    boxSelecting = false;
    canBoxSelect = false;
    dragMoving = false;
    canDragMove = false;
    location = '';
    transformTarget = null;
  };

  return {
    stop: function() {
      doubleClickZoom.enable(ctx);
    },
    start: function() {
      // Select features that should start selected,
      // probably passed in from a `draw_*` mode
      if (ctx.store) {
        ctx.store.setSelected(initiallySelectedFeatureIds.filter(function(id){
          return ctx.store.get(id) !== undefined;
        }));
        fireActionable();
      }

      // Any mouseup should stop box selecting and dragMoving
      this.on('mouseup', CommonSelectors.true, stopExtendedInteractions);

      // On mousemove that is not a drag, stop extended interactions.
      // This is useful if you drag off the canvas, release the button,
      // then move the mouse back over the canvas --- we don't allow the
      // interaction to continue then, but we do let it continue if you held
      // the mouse button that whole time
      this.on('mousemove', CommonSelectors.true, stopExtendedInteractions);

      //鼠标在bbox的控制点上，改变鼠标样式，表示可拉伸
      this.on('mousemove', CommonSelectors.isOfMetaType(Constants.meta.CONTROL), function(e){
        var location = e.featureTarget.properties.location;
        ctx.ui.queueMapClasses({ mouse: Constants.cursors[location] });
      });

      // As soon as you mouse leaves the canvas, update the feature
      this.on('mouseout', function(){return dragMoving}, fireUpdate);

      // 地图上（没有要素）的点击事件
      this.on('click', CommonSelectors.noTarget, function() {
        // Clear the re-render selection
        var _this = this;
        const wasSelected = ctx.store.getSelectedIds();
        if (wasSelected.length) {
          ctx.store.clearSelected();
          wasSelected.forEach(function(id){_this.render(id)});
        }
        doubleClickZoom.enable(ctx);
        stopExtendedInteractions();
      });

      // 顶点上的点击事件
      this.on('click', CommonSelectors.isOfMetaType(Constants.meta.VERTEX), function(e) {
        // Enter direct select mode
        ctx.events.changeMode(Constants.modes.DIRECT_SELECT, {
          featureId: e.featureTarget.properties.parent,
          coordPath: e.featureTarget.properties.coord_path,
          startPos: e.lngLat
        });
        ctx.ui.queueMapClasses({ mouse: Constants.cursors.MOVE });
      });

      // mousedown事件
      this.on('mousedown', CommonSelectors.true, function(e) {
        initialDragPanState = ctx.map.dragPan.isEnabled();
        var isActiveFeature = CommonSelectors.isActiveFeature(e);
        var isControlPoint = CommonSelectors.isOfMetaType(Constants.meta.CONTROL)(e);
        if(!isActiveFeature&&!isControlPoint){
          return;
        }
        // Stop any already-underway extended interactions
        stopExtendedInteractions();

        // Disable map.dragPan immediately so it can't start
        ctx.map.dragPan.disable();

        // Re-render it and enable drag move
        //this.render(e.featureTarget.properties.id);

        // Set up the state for drag moving
        canDragMove = true;
          
        if(isControlPoint){
          var id = e.featureTarget.properties.parent;
          location = e.featureTarget.properties.location;
          transformTarget = ctx.store.get(id);
        }
        
        dragMoveLocation = e.lngLat;
      });

      // 所有要素上的点击事件
      this.on('click', CommonSelectors.isFeature, function(e) {
        const isShiftClick = CommonSelectors.isShiftDown(e);
        const isCustomFeature = CommonSelectors.isCustomFeature(e);
        const selectedFeatureIds = ctx.store.getSelectedIds();
        const featureId = e.featureTarget.properties.id;
        const isFeatureSelected = ctx.store.isSelected(featureId);

        //自定义要素没有direct_select模式
        if(!isShiftClick && isFeatureSelected && isCustomFeature){
          return;
        }

        // Stop everything
        doubleClickZoom.disable(ctx);
        stopExtendedInteractions();
        // 没有按shift，点击一个选中的要素，进入direct_select
        if (!isShiftClick && isFeatureSelected && ctx.store.get(featureId).type !== Constants.geojsonTypes.POINT) {
          // Enter direct select mode
          return ctx.events.changeMode(Constants.modes.DIRECT_SELECT, {
            featureId: featureId
          });
        }

        // 按住shift，点击一个选中的要素，取消选中
        if (isFeatureSelected && isShiftClick) {
          // Deselect it
          ctx.store.deselect(featureId);
          ctx.ui.queueMapClasses({ mouse: Constants.cursors.POINTER });
          if (selectedFeatureIds.length === 1 ) {
            doubleClickZoom.enable(ctx);
          }
        // 按住shift，点击一个未选中的要素，执行选中
        } else if (!isFeatureSelected && isShiftClick) {
          // Add it to the selection
          ctx.store.select(featureId);
          ctx.ui.queueMapClasses({ mouse: Constants.cursors.MOVE });
        // 没有按shift，点击一个未选中的要素，切换选中要素
        } else if (!isFeatureSelected && !isShiftClick) {
          // Make it the only selected feature
          selectedFeatureIds.forEach(this.render);
          ctx.store.setSelected(featureId);
          ctx.ui.queueMapClasses({ mouse: Constants.cursors.MOVE });
        }

        // No matter what, re-render the clicked feature
        this.render(featureId);
      });

      // Dragging when drag move is enabled
      this.on('drag', function(){return canDragMove}, function(e) {
        dragMoving = true;
        e.originalEvent.stopPropagation();
        var end = ctx.map.project(e.lngLat);
        var start = ctx.map.project(dragMoveLocation);

        const delta = {
          x: end.x - start.x,
          y: end.y - start.y
        };
        //构造变换矩阵
        var matrix = new Array(new Array(1,0,0),new Array(0,1,0),new Array(0,0,1));

        if(transformTarget&&location){
          var bbox = geojsonExtent(transformTarget.toGeoJSON());
          ctx.ui.queueMapClasses({ mouse: Constants.cursors[location] });
          switch(location)
          {
          case 'E':
            var sw = ctx.map.project([bbox[0],bbox[1]]);//bbox左下角点的像素坐标，该点应保持不动
            var end2sw = end.x-sw.x;//鼠标x离左下角的距离
            var start2sw = start.x-sw.x;//起点x离左下角的距离
            if( start2sw < 1 ){ start2sw = 1; }
            if( end2sw < 1 ){ end2sw = 1; }
            var scale = end2sw/start2sw;//缩放倍数
            matrix[0][0] = scale;
            matrix[0][2] = (1-scale)*sw.x;
            break;
          case 'S':
            var nw = ctx.map.project([bbox[0],bbox[3]]);//bbox左下角点的像素坐标，该点应保持不动
            var end2nw = end.y-nw.y;//鼠标离左下角的距离
            var start2nw = start.y-nw.y;//起点离左下角的距离
            if( start2nw < 1 ){ start2nw = 1; }
            if( end2nw < 1 ){ end2nw = 1; }
            var scale = end2nw/start2nw;//缩放倍数
            matrix[1][1] = scale;
            matrix[1][2] = (1-scale)*nw.y;
            break;
          case 'W':
            var se = ctx.map.project([bbox[2],bbox[1]]);//bbox左下角点的像素坐标，该点应保持不动
            var end2se = end.x-se.x;//鼠标离左下角的距离
            var start2se = start.x-se.x;//起点离左下角的距离
            if( start2se > -1 ){ start2se = -1; }
            if( end2se > -1 ){ end2se = -1; }
            var scale = end2se/start2se;//缩放倍数
            matrix[0][0] = scale;
            matrix[0][2] = (1-scale)*se.x;
            break;
          case 'N':
            var se = ctx.map.project([bbox[2],bbox[1]]);//bbox左下角点的像素坐标，该点应保持不动
            var end2se = end.y-se.y;//鼠标离左下角的距离
            var start2se = start.y-se.y;//起点离左下角的距离
            if( start2se > -1 ){ start2se = -1; }
            if( end2se > -1 ){ end2se = -1; }
            var scale = end2se/start2se;//缩放倍数
            matrix[1][1] = scale;
            matrix[1][2] = (1-scale)*se.y;
            break;
          case 'NE':
            var sw = ctx.map.project([bbox[0],bbox[1]]);//bbox左下角点的像素坐标，该点应保持不动
            var end2sw = (end.x-sw.x)*(end.x-sw.x)+(end.y-sw.y)*(end.y-sw.y);//鼠标离左下角的距离
            var start2sw = (start.x-sw.x)*(start.x-sw.x)+(start.y-sw.y)*(start.y-sw.y);//起点离左下角的距离
            var scale = Math.sqrt(end2sw/start2sw);//缩放倍数
            matrix[0][0] = scale;
            matrix[1][1] = scale;
            matrix[0][2] = (1-scale)*sw.x;
            matrix[1][2] = (1-scale)*sw.y;
            break;
          case 'SE':
            var nw = ctx.map.project([bbox[0],bbox[3]]);//bbox左下角点的像素坐标，该点应保持不动
            var end2nw = (end.x-nw.x)*(end.x-nw.x)+(end.y-nw.y)*(end.y-nw.y);//鼠标离左下角的距离
            var start2nw = (start.x-nw.x)*(start.x-nw.x)+(start.y-nw.y)*(start.y-nw.y);//起点离左下角的距离
            var scale = Math.sqrt(end2nw/start2nw);//缩放倍数
            matrix[0][0] = scale;
            matrix[1][1] = scale;
            matrix[0][2] = (1-scale)*nw.x;
            matrix[1][2] = (1-scale)*nw.y;
            break;
          case 'NW':
            var se = ctx.map.project([bbox[2],bbox[1]]);//bbox左下角点的像素坐标，该点应保持不动
            var end2se = (end.x-se.x)*(end.x-se.x)+(end.y-se.y)*(end.y-se.y);//鼠标离左下角的距离
            var start2se = (start.x-se.x)*(start.x-se.x)+(start.y-se.y)*(start.y-se.y);//起点离左下角的距离
            var scale = Math.sqrt(end2se/start2se);//缩放倍数
            matrix[0][0] = scale;
            matrix[1][1] = scale;
            matrix[0][2] = (1-scale)*se.x;
            matrix[1][2] = (1-scale)*se.y;
            break;
          case 'SW':
            var ne = ctx.map.project([bbox[2],bbox[3]]);//bbox左下角点的像素坐标，该点应保持不动
            var end2ne = (end.x-ne.x)*(end.x-ne.x)+(end.y-ne.y)*(end.y-ne.y);//鼠标离左下角的距离
            var start2ne = (start.x-ne.x)*(start.x-ne.x)+(start.y-ne.y)*(start.y-ne.y);//起点离左下角的距离
            var scale = Math.sqrt(end2ne/start2ne);//缩放倍数
            matrix[0][0] = scale;
            matrix[1][1] = scale;
            matrix[0][2] = (1-scale)*ne.x;
            matrix[1][2] = (1-scale)*ne.y;
            break;
          default:
            break;
          }
          transformFeatures(ctx,[transformTarget], matrix);
        }else{
          matrix[0][2] = delta.x;
          matrix[1][2] = delta.y;
          transformFeatures(ctx,ctx.store.getSelected(), matrix);
        }
        //moveFeatures(ctx.store.getSelected(), delta);

        dragMoveLocation = e.lngLat;
      });

      // Mouseup, always
      this.on('mouseup', CommonSelectors.true, function(e) {
        // End any extended interactions
        if (dragMoving) {
          fireUpdate();
        } else if (boxSelecting) {
          const bbox = [
            boxSelectStartLocation,
            mouseEventPoint(e.originalEvent, ctx.container)
          ];
          const featuresInBox = featuresAt(null, bbox, ctx);
          const idsToSelect = getUniqueIds(featuresInBox)
            .filter(function(id){return !ctx.store.isSelected(id)});

          if (idsToSelect.length) {
            ctx.store.select(idsToSelect);
            idsToSelect.forEach(this.render);
            ctx.ui.queueMapClasses({ mouse: Constants.cursors.MOVE });
          }
        }
        stopExtendedInteractions();
      });

      if (ctx.options.boxSelect) {
        // Shift-mousedown anywhere
        this.on('mousedown', CommonSelectors.isShiftMousedown, function(e) {
          stopExtendedInteractions();
          ctx.map.dragPan.disable();
          // Enable box select
          boxSelectStartLocation = mouseEventPoint(e.originalEvent, ctx.container);
          canBoxSelect = true;
        });

        // Drag when box select is enabled
        this.on('drag', function(){return canBoxSelect}, function(e) {
          boxSelecting = true;
          ctx.ui.queueMapClasses({ mouse: Constants.cursors.ADD });

          // Create the box node if it doesn't exist
          if (!boxSelectElement) {
            boxSelectElement = document.createElement('div');
            boxSelectElement.classList.add(Constants.classes.BOX_SELECT);
            ctx.container.appendChild(boxSelectElement);
          }

          // Adjust the box node's width and xy position
          const current = mouseEventPoint(e.originalEvent, ctx.container);
          const minX = Math.min(boxSelectStartLocation.x, current.x);
          const maxX = Math.max(boxSelectStartLocation.x, current.x);
          const minY = Math.min(boxSelectStartLocation.y, current.y);
          const maxY = Math.max(boxSelectStartLocation.y, current.y);
          const translateValue = "translate("+minX+"px, "+minY+"px)";
          boxSelectElement.style.transform = translateValue;
          boxSelectElement.style.WebkitTransform = translateValue;
          boxSelectElement.style.width = (maxX - minX)+"px";
          boxSelectElement.style.height = (maxY - minY)+"px";
        });
      }
    },
    render: function(geojson, push) {
      if(ctx.store.isSelected(geojson.properties.id)){
        geojson.properties.active = Constants.activeStates.ACTIVE;
        if(geojson.geometry.type === Constants.geojsonTypes.POLYGON){
          var bbox = geojsonExtent(geojson);
          createControlFeature(ctx,bbox,geojson.properties.id).forEach(push);
        }
      }else{
        geojson.properties.active = Constants.activeStates.INACTIVE;
      }
      push(geojson);
      if (geojson.properties.active !== Constants.activeStates.ACTIVE
        || geojson.geometry.type === Constants.geojsonTypes.POINT) return;
      if(geojson.properties.type===Constants.featureTypes.POINT
        ||geojson.properties.type===Constants.featureTypes.LINE){
        createSupplementaryPoints(geojson).forEach(push);
      }
      fireActionable();  
    },
    trash:function() {
      ctx.store.delete(ctx.store.getSelectedIds());
      fireActionable();
    },
    combineFeatures: function() {
      const selectedFeatures = ctx.store.getSelected();

      if (selectedFeatures.length === 0 || selectedFeatures.length < 2) return;

      const coordinates = [], featuresCombined = [];
      const featureType = selectedFeatures[0].type.replace('Multi', '');

      for (var i = 0; i < selectedFeatures.length; i++) {
        const feature = selectedFeatures[i];

        if (feature.type.replace('Multi', '') !== featureType) {
          return;
        }
        if (feature.type.includes('Multi')) {
          feature.getCoordinates().forEach(function(subcoords) {
            coordinates.push(subcoords);
          });
        } else {
          coordinates.push(feature.getCoordinates());
        }

        featuresCombined.push(feature.toGeoJSON());
      }

      if (featuresCombined.length > 1) {

        const multiFeature = new MultiFeature(ctx, {
          type: Constants.geojsonTypes.FEATURE,
          properties: featuresCombined[0].properties,
          geometry: {
            type: 'Multi'+featureType,
            coordinates: coordinates
          }
        });

        ctx.store.add(multiFeature);
        ctx.store.delete(ctx.store.getSelectedIds(), { silent: true });
        ctx.store.setSelected([multiFeature.id]);

        ctx.map.fire(Constants.events.COMBINE_FEATURES, {
          createdFeatures: [multiFeature.toGeoJSON()],
          deletedFeatures: featuresCombined
        });
      }
      fireActionable();
    },
    uncombineFeatures: function() {
      const selectedFeatures = ctx.store.getSelected();
      if (selectedFeatures.length === 0) return;

      const createdFeatures = [];
      const featuresUncombined = [];

      for (var i = 0; i < selectedFeatures.length; i++) {
        const feature = selectedFeatures[i];

        if (feature instanceof MultiFeature) {
          feature.getFeatures().forEach(function(subFeature) {
            ctx.store.add(subFeature);
            subFeature.properties = feature.properties;
            createdFeatures.push(subFeature.toGeoJSON());
            ctx.store.select([subFeature.id]);
          });
          ctx.store.delete(feature.id, { silent: true });
          featuresUncombined.push(feature.toGeoJSON());
        }
      }

      if (createdFeatures.length > 1) {
        ctx.map.fire(Constants.events.UNCOMBINE_FEATURES, {
          createdFeatures: createdFeatures,
          deletedFeatures: featuresUncombined
        });
      }
      fireActionable();
    }
  };
};
