// pages/rollcall/qrcode/qrcode.js
const AV = require('../../../lib/leancloud-storage');
var QR = require("../../../lib/qrcode.js");
var ROLLCALL = AV.Object.extend('ROLLCALL');
var app = getApp();
Page({
  data: {
    imagePath: '',
    timeout: 2
  },
  onLoad: function (options) {
    // 页面初始化 options为页面跳转所带来的参数
    console.log(options)
    this.setData({
      courseId: options.courseId
    });
    var res = wx.getSystemInfoSync();
    var size = {
      w: res.windowWidth / 1.25,
      h: res.windowWidth / 1.25
    };//动态设置画布大小
    var token = options.courseId;
    this.createQrCode(token, "qrcode", size.w, size.h);

  },
  createQrCode: function (url, canvasId, cavW, cavH) {
    //调用插件中的draw方法，绘制二维码图片
    QR.qrApi.draw(url, canvasId, cavW, cavH);
    var that = this;
    //二维码生成之后调用canvasToTempImage();延迟3s，否则获取图片路径为空
    var st = setTimeout(function () {
      that.canvasToTempImage();
      clearTimeout(st);
    }, 3000);

  },
  timeoutChange: function (e) {
    this.setData({
      timeout: e.detail.value
    });
  },
  //获取临时缓存照片路径，存入data中
  canvasToTempImage: function () {
    var that = this;
    wx.canvasToTempFilePath({
      canvasId: 'qrcode',
      success: function (res) {
        console.log(res)
        var tempFilePath = res.tempFilePath;
        console.log(tempFilePath);
        that.setData({
          imagePath: tempFilePath,
        });
      },
      fail: function (res) {
        console.log(res);
      }
    });
  },
  //点击图片进行预览，长按保存分享图片
  previewImg: function (e) {
    var that = this;
    wx.showToast({
      title: '正在生成二维码图片',
      icon: 'loading',
      duration: 3000
    })
    var st = setTimeout(function () {
      var img = that.data.imagePath
      console.log(img)
      wx.previewImage({
        current: img, // 当前显示图片的http链接
        urls: [img] // 需要预览的图片http链接列表
      })
    }, 3000);
  },
  //发布点名
  createRollcall: function () {
    var that = this;
    var rollcall = new ROLLCALL();
    console.log(app.globalData.user)
    var teacher = AV.Object.createWithoutData('_User', app.globalData.user.objectId);
    rollcall.set('teacher', teacher);
    var course = AV.Object.createWithoutData('COURSE', that.data.courseId);
    rollcall.set('course', course);
    rollcall.set('type', 'qrcode');
    rollcall.set('students', []);
    rollcall.set('timeout', this.data.timeout);
    rollcall.save()
      .then(function (rc) {
        console.log(rc)
      })
      .catch(console.error);
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