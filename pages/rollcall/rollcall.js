const AV = require('../../lib/leancloud-storage');
var app = getApp();
Page({
  data: {
    tpl: "sign-in",
    courseNameArr: []
  },
  // 地理位置点名
  location: function () {
    var that = this;
    wx.showActionSheet({
      itemList: that.data.courseNameArr,
      success: function (res) {
        wx.navigateTo({
          url: 'location/location?userType=teacher&courseId=' + that.data.courses[res.tapIndex].id
        })
        console.log(that.data.courses[res.tapIndex].id)
      },
      fail: function (res) {
        console.log(res.errMsg)
      }
    });
  },
  signIn: function () {
    //学生身份签到
    var that = this;
    wx.showActionSheet({
      itemList: that.data.courseNameArr,
      success: function (res) {
        console.log(that.data.courses[res.tapIndex].id)
        var rollcallQuery = new AV.Query('ROLLCALL');
        var course = AV.Object.createWithoutData('COURSE', that.data.courses[res.tapIndex].id);
        rollcallQuery.equalTo('course', course);
        // rollcallQuery.equalTo('new', true);此处应该判断点名是否未结束
        rollcallQuery.descending('createdAt');
        rollcallQuery.limit(3);
        rollcallQuery.find().then(function (rcs) {
          if (rcs.length < 1) {
            wx.showModal({
              title: '当前无点名',
              content: '老师发布点名之后才可以签到哦！',
              showCancel: false,
              confirmText: '知道了',
              confirmColor: '#3CC51F',
              success: function (res) {

              }
            });
          } else {
            var rollcall = rcs[0];
            if (rollcall.get('type') == 'qrcode') {
              console.log('qrcode fast sign in!')
              wx.navigateTo({
                url: 'qrcode/qrcode?userType=student&rollcallId=' + rollcall.id
              });
            } else if (rollcall.get('type') == 'location') {
              console.log('location sign in!')
              wx.navigateTo({
                url: 'location/location?userType=student&rollcallId=' + rollcall.id
              });
            } else if (rollcall.get('type') == 'compass') {
              console.log('compass sign in!')
              wx.navigateTo({
                url: 'compass/compass?userType=student&rollcallId=' + rollcall.id
              });
            }
          }
        });
      },
      fail: function (res) {
        console.log(res.errMsg)
      }
    });
  },
  //二维码快速签到
  qrcode: function () {
    var that = this;
    wx.showActionSheet({
      itemList: that.data.courseNameArr,
      success: function (res) {
        wx.navigateTo({
          url: 'qrcode/qrcode?userType=teacher&courseId=' + that.data.courses[res.tapIndex].id
        })
        console.log(that.data.courses[res.tapIndex].id)
      },
      fail: function (res) {
        console.log(res.errMsg)
      }
    });
  },
  //初始化教师所授课程信息
  initTeacherCourseData: function () {
    var that = this;
    var courseQuery = new AV.Query('COURSE');
    var teacher = AV.Object.createWithoutData('_User', app.globalData.user.objectId);
    courseQuery.equalTo('teacher', teacher);
    courseQuery.find().then(function (courses) {
      var itemList = [];
      for (let i = 0; i < courses.length; i++) {
        itemList.push(courses[i].get('courseName'));
      }
      that.setData({
        courses: courses,
        courseNameArr: itemList
      });
      wx.hideToast();
    }, function (error) {
      // 异常处理
      console.log(error)
    });
  },
  //初始化学生所选课程信息
  initStudentCourseData: function () {
    var that = this;
    var courseQuery = new AV.Query('_User');
    courseQuery.include("coursesChosen");
    courseQuery.get(app.globalData.user.objectId).then(function (student) {
      var coursesChosen = student.get('coursesChosen');
      console.log(coursesChosen)
      var itemList = [];
      for (let i = 0; i < coursesChosen.length; i++) {
        itemList.push(coursesChosen[i].get('courseName'));
      }
      that.setData({
        courses: coursesChosen,
        courseNameArr: itemList
      });
      wx.hideToast();
    }, function (error) {
      // 异常处理
      console.log(error)
    });
  },
  //罗盘点名
  compass: function () {
    var that = this;
    wx.showActionSheet({
      itemList: that.data.courseNameArr,
      success: function (res) {
        wx.navigateTo({
          url: 'compass/compass?userType=teacher&courseId=' + that.data.courses[res.tapIndex].id
        })
      },
      fail: function (res) {
        console.log(res.errMsg)
      }
    });
  },
  onLoad: function (options) {
    wx.showToast({
      icon: 'loading',
      title: '初始化页面...',
      mask: true
    });
    // 页面初始化 options为页面跳转所带来的参数
    if (app.globalData.user.userType == '老师') {
      console.log('teacher')
      this.setData({
        tpl: 'rollcall'
      });
      this.initTeacherCourseData();
    } else {
      console.log('student')
      this.setData({
        tpl: 'sign-in'
      });
      this.initStudentCourseData();
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