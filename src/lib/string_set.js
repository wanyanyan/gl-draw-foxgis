function StringSet(items) {
  this._items = {};
  this._length = items ? items.length : 0;
  if (!items) return;
  for (var i = 0, l = items.length; i < l; i++) {
    if (items[i] === undefined) continue;
    this._items[items[i]] = i;
  }
}

StringSet.prototype.add = function(x) {
  this._length = this._items[x] ? this._length : this._length + 1;
  this._items[x] = this._items[x] ? this._items[x] : this._length;
  return this;
};

StringSet.prototype.delete = function(x) {
  this._length = this._items[x] ? this._length - 1 : this._length;
  delete this._items[x];
  return this;
};

StringSet.prototype.has = function(x) {
  return this._items[x] !== undefined;
};

StringSet.prototype.values = function() {
  var _this = this;
  const orderedKeys = Object.keys(_this._items).sort(function(a, b){return (_this._items[a] - _this._items[b]);});
    return orderedKeys;
};

StringSet.prototype.clear = function() {
  this._length = 0;
  this._items = {};
  return this;
};

module.exports = StringSet;
