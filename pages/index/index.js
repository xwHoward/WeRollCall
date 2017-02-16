//index.js
const AV = require('../../lib/leancloud-storage');
var Promise = require("../../lib/es6-promise.min");
var app = getApp();
var util = require('../../lib/util')
var getUserInfoPromisified = util.wxPromisify(wx.getUserInfo)

Page({
  data: {
    // userInfo: {},
    courses: []
  },
  onPullDownRefresh: function () {
    this.initUserInfo();
    wx.stopPullDownRefresh();
  },
  //注册
  register: function () {
    wx.redirectTo({
      url: '../login/login',
      success: function (res) {
        console.log("page.login redirected..")
      },
      fail: function () {
        console.log('redirect fail!')
      },
      complete: function () {
        // complete
      }
    })
  },


  //更新、从云端下载用户信息
  updateUserInfo: function () {
    var user = AV.User.current();
    return new Promise(function (resolve, reject) {
      // 调用小程序 API，得到用户信息
      getUserInfoPromisified({})
        .then(function (res) {
          // 更新当前用户的信息
          user.set(res.userInfo).save().then(user => {
            // 成功，此时可在控制台中看到更新后的用户信息
            var userQuery = new AV.Query('_User');
            userQuery.include('leaves');
            userQuery.get(user.id).then(function (user) {
              app.globalData.user = user.toJSON();
              console.log("Update userinfo on leanCloud success, app.globalData.user:", app.globalData.user)
              resolve();
            });
          }).catch(console.error);
        })
        .catch(function () {
          app.globalData.user = user;
          resolve();
        });
    });
  },



  //添加新课程
  addCourse: function () {
    wx.navigateTo({
      url: '../addCourse/addCourse',
      success: function (res) {
        // console.log("page.addCourse redirected..")
      },
      fail: function () {
        // console.log('redirect fail!')
      },
      complete: function () {
        // complete
      }
    })
  },
  //获取学生所选课程
  getChosenCourses: function () {
    var that = this;
    var studentQuery = new AV.Query('_User');
    studentQuery.include('coursesChosen');// 关键代码，用 include 告知服务端需要返回的关联属性对应的对象的详细信息，而不仅仅是 objectId
    studentQuery.get(app.globalData.user.objectId).then(function (stu) {
      that.setData({
        courses: stu.attributes.coursesChosen
      });
      wx.hideToast();
    }, function (error) {
      // 异常处理
      console.log(error)
    });

  },

  initData: function () {
    var that = this;
    // console.log("app.globalData.user", app.globalData.user)
    if (app.globalData.user.userType === "老师") {
      console.log("usertype:teacher")
      //以教师身份登录，初始化教师所授课程
      var queryCourse = new AV.Query('COURSE');
      // console.log(app.globalData.user)
      var teacher = AV.Object.createWithoutData('_User', app.globalData.user.objectId);
      queryCourse.equalTo('teacher', teacher);
      queryCourse.find().then(function (results) {
        that.setData({
          courses: results
        });
        wx.hideToast();
      }, function (error) {
        wx.hideToast();
      });
    } else {
      //以学生身份登录
      //初始化学生所选课程
      console.log("usertype:student")
      that.getChosenCourses();
    }

  },
  //初始化用户信息
  //返回用户类型：'教师'/'学生'
  initUserInfo: function () {
    var that = this;
    wx.showToast({
      icon: 'loading',
      title: '拉取用户数据中...',
      mask: true
    });
    AV.User.loginWithWeapp()
      .then(function () {
        var user = AV.User.current();
        // console.log("AV.User.current() already in client when page.index onload:", user)
        if (user.attributes.register != true) {
          // 首次登陆需要初始化身份数据
          console.log('Never registered, redirecting To login page..')
          that.register();
        } else {
          //用户已经注册过
          // console.log('Already registered, now updating user info on leanCloud from wx.getUserInfo()...')
          that.updateUserInfo()
            .then(function () {
              console.log("updateUserInfo() success! initData()...")
              that.initData();
            })
            .catch(console.error);
        }
      })
      .catch(console.error);
  },
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
    that.initUserInfo();
  }
  // ,isEmptyObj: function(obj){
  //   for (var a in obj){
  //     return !1;
  //   }
  //   return !0;
  // }
})

