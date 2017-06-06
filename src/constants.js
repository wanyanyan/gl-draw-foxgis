module.exports = {
  classes: {
    CONTROL_BASE: 'mapboxgl-ctrl',
    CONTROL_PREFIX: 'mapboxgl-ctrl-',
    CONTROL_BUTTON: 'mapbox-gl-draw_ctrl-draw-btn',
    CONTROL_BUTTON_LINE: 'mapbox-gl-draw_line',
    CONTROL_BUTTON_POLYGON: 'mapbox-gl-draw_polygon',
    CONTROL_BUTTON_POINT: 'mapbox-gl-draw_point',
    CONTROL_BUTTON_TRASH: 'mapbox-gl-draw_trash',
    CONTROL_BUTTON_COMBINE_FEATURES: 'mapbox-gl-draw_combine',
    CONTROL_BUTTON_UNCOMBINE_FEATURES: 'mapbox-gl-draw_uncombine',
    CONTROL_GROUP: 'mapboxgl-ctrl-group',
    ATTRIBUTION: 'mapboxgl-ctrl-attrib',
    ACTIVE_BUTTON: 'active',
    BOX_SELECT: 'mapbox-gl-draw_boxselect'
  },
  sources: {
    HOT: 'mapbox-gl-draw-hot',
    COLD: 'mapbox-gl-draw-cold'
  },
  cursors: {
    ADD: 'add',
    MOVE: 'move',
    DRAG: 'drag',
    POINTER: 'pointer',
    E:'e-resize',
    S:'s-resize',
    W:'w-resize',
    N:'n-resize',
    NE:'ne-resize',
    SE:'se-resize',
    NW:'nw-resize',
    SW:'sw-resize',
    NONE: 'none'
  },
  types: {
    POLYGON: 'polygon',
    LINE: 'line_string',
    POINT: 'point'
  },
  geojsonTypes: {
    FEATURE: 'Feature',
    POLYGON: 'Polygon',
    LINE_STRING: 'LineString',
    POINT: 'Point',
    FEATURE_COLLECTION: 'FeatureCollection',
    MULTI_PREFIX: 'Multi',
    MULTI_POINT: 'MultiPoint',
    MULTI_LINE_STRING: 'MultiLineString',
    MULTI_POLYGON: 'MultiPolygon'
  },
  modes: {
    DRAW_LINE_STRING: 'draw_line_string',
    DRAW_POLYGON: 'draw_polygon',
    DRAW_POINT: 'draw_point',
    DRAW_TRIANGLE: 'draw_triangle',
    DRAW_RECTANGLE: 'draw_rectangle',
    DRAW_CIRCLE: 'draw_circle',
    DRAW_ARROW: 'draw_arrow',
    DRAW_ARC: 'draw_arc',
    DRAW_BEZIER: 'draw_bezier',
    DRAW_BEZIER_ARROW: 'draw_bezier_arrow',
    DRAW_DOVETAIL_ARROW: 'draw_dovetail_arrow',
    DRAW_LINE_WITH_LABEL: 'draw_line_with_label',
    DRAW_LABEL_LINE: 'draw_label_line',
    SIMPLE_SELECT: 'simple_select',
    DIRECT_SELECT: 'direct_select',
    STATIC: 'static'
  },
  events: {
    CREATE: 'draw.create',
    DELETE: 'draw.delete',
    UPDATE: 'draw.update',
    SELECTION_CHANGE: 'draw.selectionchange',
    MODE_CHANGE: 'draw.modechange',
    RENDER: 'draw.render',
    ACTIONABLE: 'draw.actionable',
    COMBINE_FEATURES: 'draw.combine',
    UNCOMBINE_FEATURES: 'draw.uncombine'
  },
  updateActions: {
    MOVE: 'move',
    CHANGE_COORDINATES: 'change_coordinates'
  },
  meta: {
    FEATURE: 'feature',
    MIDPOINT: 'midpoint',
    VERTEX: 'vertex',
    CONTROL: 'control'
  },
  featureTypes: {
    LINE: 'line',
    POLYGON: 'polygon',
    POINT: 'point',
    ARC:'arc',
    ARROW:'arrow',
    BEZIER:'bezier',
    CIRCLE:'circle',
    RECTANGLE:'rectangle',
    TRIANGLE:'triangle',
    BEZIER_ARROW:'bezier_arrow',
    DOVETAIL_ARROW:'dovetail_arrow',
    LABEL_POINT: 'label_point',
    LABEL_LINE: 'label_line'
  },
  activeStates: {
    ACTIVE: 'true',
    INACTIVE: 'false'
  },
  LAT_MIN: -90,
  LAT_RENDERED_MIN: -85,
  LAT_MAX: 90,
  LAT_RENDERED_MAX: 85,
  LNG_MIN: -270,
  LNG_MAX: 270
};
