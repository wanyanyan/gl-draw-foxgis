module.exports = {
  enable:function(ctx) {
    setTimeout(function(){
      if (!ctx.map || !ctx.map.doubleClickZoom) return;
      ctx.map.doubleClickZoom.enable();
    }, 0);
  },
  disable:function(ctx) {
    setTimeout(function(){
      if (!ctx.map || !ctx.map.doubleClickZoom) return;
      ctx.map.doubleClickZoom.disable();
    }, 0);
  }
};
