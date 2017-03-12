const AV = require('../../lib/leancloud-storage');
var app = getApp();
var debug = app.globalData.debug;
Page({
  data: {
    userInfo: {}
  },
  onLoad: function (options) {
    var that = this;
    var intv = setInterval(function () {
      if (app.globalData.user !== null) {
        that.setData({
          userInfo: app.globalData.user
        });
        clearInterval(intv);
      }
    }, 500);
  },
  onReady: function () {
    // 页面渲染完成
  },
  onShow: function () {
    // 页面显示
    this.setData({
      userInfo: app.globalData.user
    });
  },
  onHide: function () {
    // 页面隐藏
  },
  onUnload: function () {
    // 页面关闭
  }
})