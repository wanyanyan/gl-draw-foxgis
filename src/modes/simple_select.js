const CommonSelectors = require('../lib/common_selectors');
const mouseEventPoint = require('../lib/mouse_event_point');
const featuresAt = require('../lib/features_at');
const createSupplementaryPoints = require('../lib/create_supplementary_points');
const createControlFeature = require('../lib/create_control_feature');
const StringSet = require('../lib/string_set');
const doubleClickZoom = require('../lib/double_click_zoom');
const moveFeatures = require('../lib/move_features');
const Constants = require('../constants');
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

  const initiallySelectedFeatureIds = options.featureIds || [];

  const fireUpdate = function() {
    ctx.map.fire(Constants.events.UPDATE, {
      action: Constants.updateActions.MOVE,
      features: ctx.store.getSelected().map(function(f){return f.toGeoJSON()})
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

    ctx.map.dragPan.enable();

    boxSelecting = false;
    canBoxSelect = false;
    dragMoving = false;
    canDragMove = false;
  };

  return {
    stop: function() {
      doubleClickZoom.enable(ctx);
    },
    start: function() {
      // Select features that should start selected,
      // probably passed in from a `draw_*` mode
      if (ctx.store) ctx.store.setSelected(initiallySelectedFeatureIds.filter(function(id){
        return ctx.store.get(id) !== undefined;
      }));

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

      // 选中要素的mousedown事件
      this.on('mousedown', CommonSelectors.isActiveFeature, function(e) {
        // Stop any already-underway extended interactions
        stopExtendedInteractions();

        // Disable map.dragPan immediately so it can't start
        ctx.map.dragPan.disable();

        // Re-render it and enable drag move
        this.render(e.featureTarget.properties.id);

        // Set up the state for drag moving
        canDragMove = true;
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

        const delta = {
          lng: e.lngLat.lng - dragMoveLocation.lng,
          lat: e.lngLat.lat - dragMoveLocation.lat
        };

        moveFeatures(ctx.store.getSelected(), delta);

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
    },
    trash:function() {
      ctx.store.delete(ctx.store.getSelectedIds());
    }
  };
};
