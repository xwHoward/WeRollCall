//index.js
const AV = require('../../lib/leancloud-storage');
var app = getApp();
Page({
  data: {
    userInfo: {}
  },
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
  onLoad: function () {
    var that = this;
    console.log("Enter index page")
    // 获得当前登录用户
    const user = AV.User.current();
    console.log("AV.User.current() already in app when page.index onload:")
    console.log(user)
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
          console.log('wx.getUserInfo success, returned wx userInfo:')
          console.log(userInfo)
          // 更新当前用户的信息
          user.set(userInfo).save().then(user => {
            // 成功，此时可在控制台中看到更新后的用户信息
            app.globalData.user = user.toJSON();
            console.log("Update userinfo on leanCloud success, returned new user info:")
            console.log(app.globalData.user)
          }).catch(console.error);
        }
      }); 
    }
  }
  // ,isEmptyObj: function(obj){
  //   for (var a in obj){
  //     return !1;
  //   }
  //   return !0;
  // }
})

