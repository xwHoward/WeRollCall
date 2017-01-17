const AV = require('../../lib/leancloud-storage');
var app = getApp();
Page({
  data: {
    tpl: "",
    courseNameArr: []
  },
  //定时点名
  timeout: function () {

  },
  // 地理位置点名
  location: function () {
    wx.navigateTo({
      url: 'location/location'
    })
  },
  signIn: function () {
    wx.scanCode({
      success: (res) => {
        console.log(res.result)
        var rollcallQuery = new AV.Query('ROLLCALL');
        var course = AV.Object.createWithoutData('COURSE', res.result);
        rollcallQuery.equalTo('course', course);
        rollcallQuery.descending('createdAt');
        rollcallQuery.limit(3);
        rollcallQuery.find().then(function (rcs) {
          console.log(rcs[0])
          var rollcall = rcs[0];
          if (rollcall.attributes.type == 'qrcode') {
            console.log('qrcode fast sign in!')
            wx.navigateTo({
              url: 'qrcode/qrcode'
            })
          } else if (rollcall.attributes.type == 'location') {
            console.log('location sign in!')
          }
        });
      }
    })
  },
  //二维码快速签到
  qrcode: function () {
    var that = this;
    var courseQuery = new AV.Query('COURSE');
    var teacher = AV.Object.createWithoutData('_User', app.globalData.user.objectId);
    courseQuery.equalTo('teacher', teacher);// 关键代码，用 include 告知服务端需要返回的关联属性对应的对象的详细信息，而不仅仅是 objectId
    courseQuery.find().then(function (courses) {
      var itemList = [];
      for (let i = 0; i < courses.length; i++) {
        itemList.push(courses[i].attributes.courseName);
      }
      that.setData({
        courseNameArr: itemList
      })
      wx.showActionSheet({
        itemList: that.data.courseNameArr,
        success: function (res) {
          wx.navigateTo({
            url: 'qrcode/qrcode?courseId=' + courses[res.tapIndex].id
          })
          console.log(courses[res.tapIndex].id)
        },
        fail: function (res) {
          console.log(res.errMsg)
        }
      })
    }, function (error) {
      // 异常处理
      console.log(error)
    });
  },
  onLoad: function (options) {
    // 页面初始化 options为页面跳转所带来的参数
    if (app.globalData.user.userType == '老师') {
      this.setData({
        tpl: 'rollcall'
      });
    } else {
      this.setData({
        tpl: 'sign-in'
      });
    }
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