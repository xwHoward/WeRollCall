const AV = require('../../lib/leancloud-storage');
var app = getApp();
var debug = app.globalData.debug;
Page({
  data: {
    template: "",
    courses: [],
    courseNameArr: [],
    banners: [
      'https://dn-03kfwto5.qbox.me/3918513f0c79967c102f.PNG',
      'https://dn-03kfwto5.qbox.me/3918513f0c79967c102f.PNG'
    ]
  },
  // 地理位置点名
  location: function () {
    var that = this;
    wx.showActionSheet({
      itemList: that.data.courseNameArr,
      success: function (res) {
        wx.navigateTo({
          url: 'location/location?userType=teacher&courseId=' + that.data.courses[res.tapIndex].objectId
        })
      },
      fail: function (res) {
        debug && console.log(res.errMsg)
      }
    });
  },
  signIn: function () {
    //学生身份签到
    var that = this;
    wx.showActionSheet({
      itemList: that.data.courseNameArr,
      success: function (res) {
        //获取当前点名
        var paramsJson = {
          courseId: that.data.courses[res.tapIndex].objectId
        };
        AV.Cloud.run('getCurrentRollcall', paramsJson)
          .then(function (data) {
            console.log('getCurrentRollcall:', data)
            if (data === 0) {
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
              app.globalData.signInTag.forEach(function (el, index) {
                if (el.rollcallId === data.objectId) {
                  //已经签过到
                  wx.showModal({
                    title: '已经签过到啦',
                    content: '不可以重复签到哦！',
                    showCancel: false,
                    confirmText: '知道了',
                    confirmColor: '#3CC51F',
                    success: function (res) {
                      wx.switchTab({
                        url: '/pages/rollcall/rollcall',
                        success: function (res) {
                        },
                        fail: function () {
                        },
                        complete: function () {
                        }
                      })
                    }
                  });
                }
              });
              if (data.type === 'qrcode') {
                debug && console.log('qrcode fast sign in!')
                wx.navigateTo({
                  url: 'qrcode/qrcode?userType=student&rollcallId=' + data.objectId
                });
              } else if (data.type === 'location') {
                debug && console.log('location sign in!')
                wx.navigateTo({
                  url: 'location/location?userType=student&rollcallId=' + data.objectId
                });
              } else if (data.type === 'compass') {
                debug && console.log('compass sign in!')
                wx.navigateTo({
                  url: 'compass/compass?userType=student&rollcallId=' + data.objectId
                });
              }
            }
          }, function (err) {
            wx.showModal({
              title: '出了点问题',
              content: '同学，重试一下吧！',
              showCancel: false,
              confirmText: '知道了',
              confirmColor: '#3CC51F',
              success: function (res) {
              }
            });
          });
      },
      fail: function (res) {
        debug && console.log(res.errMsg)
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
          url: 'qrcode/qrcode?userType=teacher&courseId=' + that.data.courses[res.tapIndex].objectId
        })
      },
      fail: function (res) {
        debug && console.log(res.errMsg)
      }
    });
  },
  //初始化教师所授课程信息
  initTeacherCourseData: function () {
    var that = this;
    var courses = app.globalData.user.courses;
    debug && console.log('教师已建课程：', courses)
    var itemList = [];
    for (let i = 0; i < courses.length; i++) {
      itemList.push(courses[i].courseName);
    }
    that.setData({
      courses: courses,
      courseNameArr: itemList
    });
  },
  //初始化学生所选课程信息
  initStudentCourseData: function () {
    var that = this;
    var coursesChosen = app.globalData.user.coursesChosen;
    debug && console.log('学生已选课程：', coursesChosen)
    var itemList = [];
    for (let i = 0; i < coursesChosen.length; i++) {
      itemList.push(coursesChosen[i].courseName);
    }
    that.setData({
      courses: coursesChosen,
      courseNameArr: itemList
    });
  },
  //罗盘点名
  compass: function () {
    var that = this;
    wx.showActionSheet({
      itemList: that.data.courseNameArr,
      success: function (res) {
        wx.navigateTo({
          url: 'compass/compass?userType=teacher&courseId=' + that.data.courses[res.tapIndex].objectId
        })
      },
      fail: function (res) {
        debug && console.log(res.errMsg)
      }
    });
  },
  onLoad: function (options) {
    var that = this;
    wx.showToast({
      icon: 'loading',
      title: '初始化页面...',
      mask: true
    });
    var intv = setInterval(function () {
      if (app.globalData.user !== null) {
        if (app.globalData.user.userType === 'teacher') {
          debug && console.log('teacher')
          that.setData({
            template: 'rollcall'
          });
          that.initTeacherCourseData();
        } else {
          debug && console.log('student')
          that.setData({
            template: 'sign-in'
          });
          that.initStudentCourseData();
        }
        wx.hideToast();
        clearInterval(intv);
      }
    }, 500);
  },
  onReady: function () {
  },
  onShow: function () {
    app.globalData.user.userType === 'teacher' ? this.initTeacherCourseData() : this.initStudentCourseData();
  },
  onHide: function () {
  },
  onUnload: function () {
  }
})