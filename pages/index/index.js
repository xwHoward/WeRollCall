const AV = require('../../lib/leancloud-storage');
// var Promise = require("../../lib/es6-promise.min");
var app = getApp();
// var util = require('../../lib/util')
// var getUserInfoPromisified = util.wxPromisify(wx.getUserInfo)
var debug = app.globalData.debug;
Page({
  data: {
    courses: []
  },
  onPullDownRefresh: function () {
    var that = this;
    app.updateUserInfo().then(function () {
      that.initData();
      wx.stopPullDownRefresh();
    });
  },
  //注册
  // register: function () {
  //   wx.redirectTo({
  //     url: '../login/login',
  //     success: function (res) {
  //       debug && console.log("page.login redirected..")
  //     },
  //     fail: function () {
  //       debug && console.log('redirect fail!')
  //     },
  //     complete: function () {
  //       // complete
  //     }
  //   })
  // },

  //更新、从云端下载用户信息,对app.global.data赋值
  // updateUserInfo: function () {
  //   var user = AV.User.current();
  //   return new Promise(function (resolve, reject) {
  //     // 调用小程序 API，得到用户信息
  //     getUserInfoPromisified({})
  //       .then(function (res) {
  //         // 更新当前用户的信息
  //         user.set(res.userInfo).save()
  //           .then(function (user) {
  //             // 成功，此时可在控制台中看到更新后的用户信息
  //             var userQuery = new AV.Query('_User');

  //             userQuery.include('leaves');//是否要在初始化时加载请假数据？？？
  //             userQuery.include('coursesChosen');//是否要在初始化时加载选课数据？？？
  //             userQuery.include('courses');//是否要在初始化时加载选课数据？？？

  //             userQuery.get(user.id).then(function (user) {
  //               app.globalData.user = user.toJSON();
  //               debug && console.log("Update userinfo on leanCloud success, app.globalData.user:", app.globalData.user)
  //               resolve();
  //             });
  //           })
  //           .catch(function (err) {
  //             reject(err);
  //           });
  //       })
  //       .catch(function () {
  //         app.globalData.user = user.toJSON();
  //         resolve();
  //       });
  //   });
  // },

  //添加新课程
  addCourse: function () {
    wx.navigateTo({
      url: '../addCourse/addCourse',
      success: function (res) {
        // debug && console.log("page.addCourse redirected..")
      },
      fail: function () {
        // debug && console.log('redirect fail!')
      },
      complete: function () {
        // complete
      }
    })
  },

  //获取学生所选课程
  // getChosenCourses: function () {
  //   var that = this;
  //   return new Promise(function (resolve, reject) {
  //     var studentQuery = new AV.Query('_User');
  //     studentQuery.include('coursesChosen');
  //     studentQuery.get(app.globalData.user.objectId).then(function (stu) {
  //       that.setData({
  //         courses: stu.toJSON().coursesChosen
  //       });
  //       resolve();
  //     }, function (error) {
  //       // 异常处理
  //       reject(error);
  //     });
  //   });
  // },

  initData: function () {
    var that = this;
    // return new Promise(function (resolve, reject) {
    if (app.globalData.user.userType === "老师") {
      debug && console.log("usertype:teacher")
      //以教师身份登录，初始化教师所授课程
      that.setData({
        courses: app.globalData.user.courses
      });
      // var queryCourse = new AV.Query('COURSE');
      // var teacher = AV.Object.createWithoutData('_User', app.globalData.user.objectId);
      // queryCourse.equalTo('teacher', teacher);
      // queryCourse.find().then(function (results) {
      //   debug && console.log("teacher's courses:", results)
      //   that.setData({
      //     courses: results.toJSON()
      //   });
      //   debug && console.log("teacher's courses:", results.toJSON())
      //   resolve();
      // }, function (error) {
      //   reject(error);
      // });
    } else {
      //以学生身份登录
      //初始化学生所选课程
      debug && console.log("usertype:student")
      that.setData({
        courses: app.globalData.user.coursesChosen
      });
      // that.getChosenCourses().then(function () {
      //   resolve();
      // }).catch(function (err) {
      //   reject(error);
      // });
    }
    // });
  },

  //初始化用户信息
  //返回用户类型：'教师'/'学生'
  // initUserInfo: function () {
  //   var that = this;
  //   AV.User.loginWithWeapp()
  //     .then(function () {
  //       var user = AV.User.current();
  //       if (user.get('register') != true) {
  //         // 首次登陆需要初始化身份数据
  //         that.register();
  //       } else {
  //         //用户已经注册过
  //         wx.showToast({
  //           icon: 'loading',
  //           title: '初始化数据...',
  //           mask: true
  //         });
  //         that.updateUserInfo()
  //           .then(function () {
  //             //app.global.data赋值成功
  //             that.initData();
  //             wx.hideToast();
  //             // that.initData().then(function () {
  //             //   wx.hideToast();
  //             // }).catch(function (err) {
  //             //   wx.hideToast();
  //             // });
  //           })
  //           .catch(console.error);
  //       }
  //     })
  //     .catch(console.error);
  // },

  goToStat: function (e) {
    wx.navigateTo({
      url: 'stat/stat?courseId=' + e.target.dataset.courseId,
      success: function (res) {
        // success
      },
      fail: function () {
        // fail
      },
      complete: function () {
        // complete
      }
    })
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
    }, 500)
  }
})

