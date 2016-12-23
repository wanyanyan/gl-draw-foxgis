module.exports = function(a, b) {
  if (a.length !== b.length) return false;
  	return JSON.stringify(a.map(function(id){return id;}).sort()) === JSON.stringify(b.map(function(id){return id;}).sort());
};
