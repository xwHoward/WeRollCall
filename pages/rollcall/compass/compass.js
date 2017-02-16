Page({
  data: {},
  onLoad: function (options) {
    // 页面初始化 options为页面跳转所带来的参数

  },
  getCompassInfo: function () {
    var that = this;
    wx.onCompassChange(function (res) {
      that.setData({
        direction: res.direction
      });
    });
    wx.onAccelerometerChange(function (res) {
      that.setData({
        x: res.x,
        y: res.y,
        z: res.z
      });
    });
  },
  onReady: function () {
    // 页面渲染完成
  },
  onShow: function () {
    // 页面显示
  },
  onHide: function () {
    // 页面隐藏
  },
  onUnload: function () {
    // 页面关闭
  }
})