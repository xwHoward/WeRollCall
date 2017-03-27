const AV = require('../../lib/leancloud-storage');
var app = getApp();
var debug = app.globalData.debug;
Page({
  data: {
    courses: []
  },
  onPullDownRefresh: function () {
    var that = this;
    wx.showNavigationBarLoading()
    app.updateUserInfo().then(function () {
      that.initData();
      wx.hideNavigationBarLoading()
      wx.stopPullDownRefresh();
    });
  },
  
  //添加新课程
  addCourse: function () {
    wx.navigateTo({
      url: '../addCourse/addCourse',
      success: function (res) {
      },
      fail: function () {
      },
      complete: function () {
      }
    })
  },

  initData: function () {
    var that = this;
    if (app.globalData.user.userType === "teacher") {
      debug && console.log("usertype:teacher")
      //以教师身份登录，初始化教师所授课程
      that.setData({
        courses: app.globalData.user.courses
      });
    } else {
      //以学生身份登录
      //初始化学生所选课程
      debug && console.log("usertype:student")
      that.setData({
        courses: app.globalData.user.coursesChosen
      });
    }
  },

  goToStat: function (e) {
    wx.navigateTo({
      url: 'stat/stat?courseId=' + e.target.dataset.courseId,
      success: function (res) {
        // success
      },
      fail: function () {
        // fail
      }
    })
  },
  switchIdentity: function (e) {
    app.globalData.user.userType = app.globalData.user.userType === 'student' ? 'teacher' : 'student';
  },
  onLoad: function () {
    var that = this;
    wx.showToast({
      icon: 'loading',
      title: '获取数据中...',
      mask: true
    });
    var intv = setInterval(function () {
      if (app.globalData.user !== null) {
        that.initData();
        wx.hideToast();
        clearInterval(intv);
      }
    }, 500);
  }
})

