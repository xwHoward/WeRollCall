//index.js
const AV = require('../../lib/leancloud-storage');
var Promise = require("../../lib/bluebird");
var app = getApp();
var util = require('../../lib/util')
var getUserInfoPromisified = util.wxPromisify(wx.getUserInfo)

Page({
  data: {
    userInfo: {},
    courses:[]
  },
  onPullDownRefresh: function(){
    this.initUserInfo();
    wx.stopPullDownRefresh();
  },
  //注册
  register: function(){
    wx.redirectTo({
      url: '../login/login',
      success: function(res){
        console.log("page.login redirected..")
      },
      fail: function() {
        console.log('redirect fail!')
      },
      complete: function() {
        // complete
      }
    })
  },


  //更新、从云端下载用户信息
  updateUserInfo: function(){
    var user = AV.User.current();
    return new Promise(function(resolve, reject){
      // 调用小程序 API，得到用户信息
      getUserInfoPromisified({})
      .then(function (res) {
        console.log('wx.getUserInfo success, returned wx userInfo:', res.userInfo)
        // 更新当前用户的信息
        user.set(res.userInfo).save().then(user => {
          // 成功，此时可在控制台中看到更新后的用户信息
          app.globalData.user = user.toJSON();
          console.log("Update userinfo on leanCloud success, returned new user info:", app.globalData.user)
          resolve();
        }).catch(console.error);
      })
      .catch(function () {
          console.log("Update userinfo on leanCloud FAILED! Downloading userinfo on leanCloud...")
          //从LeanCloud下载用户信息
          var query = new AV.Query('_User');
          query.get(user.id).then(function (userinfo) {
            // 成功获得实例
            console.log("Download userinfo on leanCloud SUCCESS!")
            app.globalData.user = userinfo[0].toJSON();
            resolve();
          }, function (error) {
            // 异常处理
            reject(new Error(error));
          });
      });
    });
  },



  //添加新课程
  addCourse: function(){
    wx.navigateTo({
      url: '../addCourse/addCourse',
      success: function(res){
        console.log("page.addCourse redirected..")
      },
      fail: function() {
        console.log('redirect fail!')
      },
      complete: function() {
        // complete
      }
    })
  },
  //获取学生所选课程
  getChosenCourses: function(){
    var that = this;
    //从coursesChosen字段中取出id，到COURSE表中查找相应的行
    var results = [];
    app.globalData.user.coursesChosen.forEach(function (e) {
      var queryCourse = new AV.Query('COURSE');
      queryCourse.equalTo('objectId', e.objectId);
      queryCourse.find().then(function (course) {
        results.push(course[0])
        that.setData({
          courses: results
        });
      });
    });
  },

  initData: function(){
    var that = this;
    if (app.globalData.user.userType === "老师") {
      console.log("usertype:teacher")
      //以教师身份登录，初始化教师所授课程
      var queryCourse = new AV.Query('COURSE');
      console.log(app.globalData.user)
      var teacher = AV.Object.createWithoutData('_User', app.globalData.user.objectId);
      queryCourse.equalTo('teacher', teacher);
      queryCourse.find().then(function (results) {
        that.setData({
          courses: results
        });
        resolve();
      }, function (error) {
        reject(error)
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
  initUserInfo: function(){
    var that = this;
    var user = AV.User.current();
    console.log("AV.User.current() already in client when page.index onload:",user)
    
    if(user == null){
        // 首次登陆需要初始化身份数据
        console.log('No user info in app, redirecting To login page..')
        that.register();
    }else{
      //客户端存在用户信息
      console.log('Userinfo in client exists, now updating user info on leanCloud from wx.getUserInfo()...')
      that.updateUserInfo()
      .then(function(){
        that.initData();
      })
      .catch(console.error);
    }
  },
  onLoad: function () {
    // wx.clearStorageSync()
    console.log("Enter index page")
    this.initUserInfo();
  }
  // ,isEmptyObj: function(obj){
  //   for (var a in obj){
  //     return !1;
  //   }
  //   return !0;
  // }
})

