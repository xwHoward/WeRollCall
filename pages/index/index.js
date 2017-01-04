//index.js
const AV = require('../../lib/leancloud-storage');
var app = getApp();
Page({
  data: {
    userInfo: {},
    courses:[]
  },
  onPullDownRefresh: function(){
    this.initData();
    wx.stopPullDownRefresh();
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
  initData: function(){
    var that = this;
    if(app.globalData.user.userType === "老师"){
      //以教师身份登录，初始化教师所授课程
      var queryCourse = new AV.Query('COURSE');
      console.log(app.globalData.user)
      var teacher = AV.Object.createWithoutData('_User', app.globalData.user.objectId);
      queryCourse.equalTo('teacher', teacher);
      queryCourse.find().then(function (results) {
        console.log(results)
        that.setData({
          courses: results
        });
      }, function (error) {
      });
    } else {
      //以学生身份登录
      //初始化学生所选课程
      console.log("usertype:student")
      //从coursesChosen字段中取出id，到COURSE表中查找相应的行
      var results = [];
      app.globalData.user.coursesChosen.forEach(function(e){
        var queryCourses = new AV.Query('COURSE');
        queryCourses.equalTo('objectId',e.objectId);
        queryCourses.find().then(function(course){
          results.push(course)
          that.setData({
            courses: results
          });
        })
      });
    }
  },
  //初始化用户信息
  //返回用户类型：'教师'/'学生'
  initUserInfo: function(cb){
    var that = this;
    // 获得当前登录用户
    const user = AV.User.current();
    console.log("AV.User.current() already in app when page.index onload:",user)
    console.log("app.globalData.user already in app when page.index onload:",app.globalData.user)
    if(user == null){
        // 首次登陆需要初始化身份数据
        console.log('No user info in app, redirecting To login page..')
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
    }else{
      console.log('Userinfo in app exists, Updating user info on leanCloud')
      // 调用小程序 API，得到用户信息
      wx.getUserInfo({
        success: ({userInfo}) => {
          console.log('wx.getUserInfo success, returned wx userInfo:',userInfo)
          // 更新当前用户的信息
          user.set(userInfo).save().then(user => {
            // 成功，此时可在控制台中看到更新后的用户信息
            app.globalData.user = user.toJSON();
            console.log("Update userinfo on leanCloud success, returned new user info:",app.globalData.user)
            cb();
          }).catch(console.error);
        },
        fail: function(){
          console.log("Update userinfo on leanCloud FAILED!")
          app.globalData.user = user.toJSON();
          cb();
        },
        complete: function(){
        }
      });
    }
  },
  onLoad: function () {
    console.log("Enter index page")
    this.initUserInfo(this.initData);
  },
  onShow: function(){
    
  }
  // ,isEmptyObj: function(obj){
  //   for (var a in obj){
  //     return !1;
  //   }
  //   return !0;
  // }
})

