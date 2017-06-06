const setupModeHandler = require('./lib/mode_handler');
const getFeaturesAndSetCursor = require('./lib/get_features_and_set_cursor');
const isClick = require('./lib/is_click');
const Constants = require('./constants');

const modes = {};
modes[Constants.modes.SIMPLE_SELECT] = require('./modes/simple_select');
modes[Constants.modes.DIRECT_SELECT] = require('./modes/direct_select');
modes[Constants.modes.DRAW_POINT] = require('./modes/draw_point');
modes[Constants.modes.DRAW_TRIANGLE] = require('./modes/draw_triangle');
modes[Constants.modes.DRAW_RECTANGLE] = require('./modes/draw_rectangle');
modes[Constants.modes.DRAW_CIRCLE] = require('./modes/draw_circle');
modes[Constants.modes.DRAW_ARROW] = require('./modes/draw_arrow');
modes[Constants.modes.DRAW_ARC] = require('./modes/draw_arc');
modes[Constants.modes.DRAW_BEZIER] = require('./modes/draw_bezier');
modes[Constants.modes.DRAW_BEZIER_ARROW] = require('./modes/draw_bezier_arrow');
modes[Constants.modes.DRAW_DOVETAIL_ARROW] = require('./modes/draw_dovetail_arrow');
modes[Constants.modes.DRAW_LINE_STRING] = require('./modes/draw_line_string');
modes[Constants.modes.DRAW_POLYGON] = require('./modes/draw_polygon');
modes[Constants.modes.DRAW_LINE_WITH_LABEL] = require('./modes/draw_line_with_label');
modes[Constants.modes.DRAW_LABEL_LINE] = require('./modes/draw_label_line');
modes[Constants.modes.STATIC] = require('./modes/static');

module.exports = function(ctx) {

  var mouseDownInfo = {};
  const events = {};
  var currentModeName = Constants.modes.SIMPLE_SELECT;
  var currentMode = setupModeHandler(modes.simple_select(ctx), ctx);

  events.drag = function(event) {
    if (isClick(mouseDownInfo, {
      point: event.point,
      time: new Date().getTime()
    })) {
      event.originalEvent.stopPropagation();
    }
    else {
      //ctx.ui.queueMapClasses({ mouse: Constants.cursors.DRAG });
      currentMode.drag(event);
    }
  };

  events.mousemove = function(event) {
    const button = event.originalEvent.buttons !== undefined ? event.originalEvent.buttons : event.originalEvent.which;
    if (button === 1) {
      return events.drag(event);
    }
    const target = getFeaturesAndSetCursor(event, ctx);
    event.featureTarget = target;
    currentMode.mousemove(event);
  };

  events.mousedown = function(event) {
    mouseDownInfo = {
      time: new Date().getTime(),
      point: event.point
    };
    var target = getFeaturesAndSetCursor(event, ctx);
    event.featureTarget = target;
    currentMode.mousedown(event);
  };

  events.mouseup = function(event) {
    const target = getFeaturesAndSetCursor(event, ctx);
    event.featureTarget = target;

    if (isClick(mouseDownInfo, {
      point: event.point,
      time: new Date().getTime()
    })) {
      currentMode.click(event);
    } else {
      currentMode.mouseup(event);
    }
  };

  events.mouseout = function(event) {
    currentMode.mouseout(event);
  };

  // 8 - Backspace
  // 46 - Delete
  const isKeyModeValid = function(code){return !(code === 8 || code === 46 || (code >= 48 && code <= 57))};

  events.keydown = function(event) {
    if ((event.keyCode === 8 || event.keyCode === 46) && ctx.options.controls.trash) {
      event.preventDefault();
      currentMode.trash();
    } else if (isKeyModeValid(event.keyCode)) {
      currentMode.keydown(event);
    } else if (event.keyCode === 49 && ctx.options.controls.point) {
      changeMode(Constants.modes.DRAW_POINT);
    } else if (event.keyCode === 50 && ctx.options.controls.line_string) {
      changeMode(Constants.modes.DRAW_LINE_STRING);
    } else if (event.keyCode === 51 && ctx.options.controls.polygon) {
      changeMode(Constants.modes.DRAW_POLYGON);
    }
  };

  events.keyup = function(event) {
    if (isKeyModeValid(event.keyCode)) {
      currentMode.keyup(event);
    }
  };

  events.zoomend = function() {
    ctx.store.changeZoom();
  };

  events.data = function(event) {
    if (event.dataType === 'style') {
      const setup = ctx.setup;
      const map = ctx.map;
      const options = ctx.options;
      const store = ctx.store;
      const hasLayers = !!options.styles.find(function(style){return map.getLayer(style.id)});
      if (!hasLayers) {
        setup.addLayers();
        store.setDirty();
        store.render();
      }
    }
  };

  function changeMode(modename, nextModeOptions, eventOptions) {
    if(eventOptions===undefined){eventOptions={};}
    currentMode.stop();

    const modebuilder = modes[modename];
    if (modebuilder === undefined) {
      throw new Error(modename+" is not valid");
    }
    currentModeName = modename;
    const mode = modebuilder(ctx, nextModeOptions);
    currentMode = setupModeHandler(mode, ctx);

    if (!eventOptions.silent) {
      ctx.map.fire(Constants.events.MODE_CHANGE, { mode: modename});
    }

    ctx.store.setDirty();
    ctx.store.render();
  }

  const actionState = {
    trash: false,
    combineFeatures: false,
    uncombineFeatures: false
  };

  function actionable(actions) {
    var changed = false;
    Object.keys(actions).forEach(function(action) {
      if (actionState[action] === undefined) throw new Error('Invalid action type');
      if (actionState[action] !== actions[action]) changed = true;
      actionState[action] = actions[action];
    });
    if (changed) ctx.map.fire(Constants.events.ACTIONABLE, { actions: actionState });
  }

  const api = {
    changeMode:changeMode,
    actionable:actionable,
    currentModeName: function() {
      return currentModeName;
    },
    currentModeRender: function(geojson, push) {
      return currentMode.render(geojson, push);
    },
    fire: function(name, event) {
      if (events[name]) {
        events[name](event);
      }
    },
    addEventListeners: function() {
      ctx.map.on('mousemove', events.mousemove);
      ctx.map.on('mousedown', events.mousedown);
      ctx.map.on('mouseup', events.mouseup);
      ctx.map.on('data', events.data);

      ctx.container.addEventListener('mouseout', events.mouseout);

      if (ctx.options.keybindings) {
        ctx.container.addEventListener('keydown', events.keydown);
        ctx.container.addEventListener('keyup', events.keyup);
      }
    },
    removeEventListeners: function() {
      ctx.map.off('mousemove', events.mousemove);
      ctx.map.off('mousedown', events.mousedown);
      ctx.map.off('mouseup', events.mouseup);
      ctx.map.off('data', events.data);

      ctx.container.removeEventListener('mouseout', events.mouseout);

      if (ctx.options.keybindings) {
        ctx.container.removeEventListener('keydown', events.keydown);
        ctx.container.removeEventListener('keyup', events.keyup);
      }
    },
    trash: function(options) {
      currentMode.trash(options);
    },
    combineFeatures: function() {
      currentMode.combineFeatures();
    },
    uncombineFeatures: function() {
      currentMode.uncombineFeatures();
    },
    getMode: function() {
      return currentModeName;
    }
  };

  return api;
};
