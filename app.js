const AV = require('lib/leancloud-storage');

AV.init({
  appId: '03kfWtO56pCUw6bmPTJREwTA-gzGzoHsz',
  appKey: 'RY8S4ezaMJ9bMGGG45unyyEX',
});

var Promise = require("lib/es6-promise.min");
var util = require('lib/util')
var getUserInfoPromisified = util.wxPromisify(wx.getUserInfo)

App({
  onLaunch: function () {
    this.initUserInfo();
  },
  onShow: function () {
    // this.initUserInfo();
  },
  //初始化用户信息
  //返回用户类型：'教师'/'学生'
  initUserInfo: function () {
    var that = this;
    AV.User.loginWithWeapp()
      .then(function () {
        var user = AV.User.current();
        if (user.get('register') != true) {
          // 首次登陆需要初始化身份数据
          that.register();
        } else {
          //用户已经注册过
          that.updateUserInfo()
            .then(function () {
              wx.hideToast();
            })
            .catch(console.error);
        }
      })
      .catch(console.error);
  },
  //更新、从云端下载用户信息,对app.global.data赋值
  updateUserInfo: function () {
    var that = this;
    var user = AV.User.current();
    return new Promise(function (resolve, reject) {
      // 调用小程序 API，得到用户信息
      getUserInfoPromisified({})
        .then(function (res) {
          // 更新当前用户的信息
          user.set(res.userInfo).save()
            .then(function (user) {
              // 成功，此时可在控制台中看到更新后的用户信息
              var userQuery = new AV.Query('_User');

              userQuery.include('leaves');//是否要在初始化时加载请假数据？？？
              userQuery.include('coursesChosen');//是否要在初始化时加载选课数据？？？
              userQuery.include('courses');//是否要在初始化时加载选课数据？？？

              userQuery.get(user.id).then(function (user) {
                that.globalData.user = user.toJSON();
                console.log("Update userinfo on leanCloud success, that.globalData.user:", that.globalData.user)
                resolve();
              });
            })
            .catch(function (err) {
              reject(err);
            });
        })
        .catch(function () {
          that.globalData.user = user.toJSON();
          resolve();
        });
    });
  },
  onHide: function () {
  },
  //注册
  register: function () {
    wx.redirectTo({
      url: 'pages/login/login',
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
  globalData: {
    user: null,
    signInTag: [],
    leaveTag: []
  }
})
