const xtend = require('xtend');
const constrainFeatureMovement = require('./constrain_feature_movement');
const Constants = require('../constants');

module.exports = function(features, delta) {
  const constrainedDelta = constrainFeatureMovement(features.map(function(feature){return feature.toGeoJSON()}), delta);

  features.forEach(function(feature){
    const currentCoordinates = feature.getCoordinates();

    const moveCoordinate = function(coord){return [coord[0] + constrainedDelta.lng, coord[1] + constrainedDelta.lat]};
    const moveRing = function(ring){return ring.map(function(coord){return moveCoordinate(coord)})};
    const moveMultiPolygon = function(multi){return multi.map(function(ring){return moveRing(ring)})};

    var nextCoordinates;
    if (feature.type === Constants.geojsonTypes.POINT) {
      nextCoordinates = moveCoordinate(currentCoordinates);
    } else if (feature.type === Constants.geojsonTypes.LINE_STRING || feature.type === Constants.geojsonTypes.MULTI_POINT) {
      nextCoordinates = currentCoordinates.map(moveCoordinate);
    } else if (feature.type === Constants.geojsonTypes.POLYGON || feature.type === Constants.geojsonTypes.MULTI_LINE_STRING) {
      nextCoordinates = currentCoordinates.map(moveRing);
    } else if (feature.type === Constants.geojsonTypes.MULTI_POLYGON) {
      nextCoordinates = currentCoordinates.map(moveMultiPolygon);
    }

    feature.incomingCoords(nextCoordinates);
  });
};
