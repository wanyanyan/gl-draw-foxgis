const sortFeatures = require('./sort_features');
const mapEventToBoundingBox = require('./map_event_to_bounding_box');
const Constants = require('../constants');
const StringSet = require('./string_set');

var META_TYPES = [
  Constants.meta.FEATURE,
  Constants.meta.MIDPOINT,
  Constants.meta.VERTEX,
  Constants.meta.CONTROL
];

// Requires either event or bbox
module.exports = function(event, bbox, ctx) {
  if (ctx.map === null) return [];

  const box = (event) ? mapEventToBoundingBox(event, ctx.options.clickBuffer) : bbox;

  var queryParams = {};
  if (ctx.options.styles) queryParams.layers = ctx.options.styles.map(function(s){return s.id});

  var features = ctx.map.queryRenderedFeatures(box, queryParams)
    .filter(function(feature) {
      return META_TYPES.indexOf(feature.properties.meta) !== -1;
    });

  const featureIds = new StringSet();
  const uniqueFeatures = [];
  features.forEach(function(feature) {
    const featureId = feature.properties.id;
    if (featureIds.has(featureId)) return;
    featureIds.add(featureId);
    uniqueFeatures.push(feature);
  });

  return sortFeatures(features);
};
