var app = getApp();
const AV = require('../../lib/leancloud-storage');
Page({
  data: {
    userType: ['学生', '老师'],
    index: 0,
    invalid: true
  },
  bindPickerChange: function (e) {
    this.setData({
      index: e.detail.value
    })
  },
  bindIdInput: function (e) {
    this.setData({
      userId: e.detail.value
    })
  },
  bindNameInput: function (e) {
    this.setData({
      userName: e.detail.value
    })
    if (this.data.userName != '' && this.data.userId !== '') {
      this.setData({
        invalid: false
      })
    }
  },
  onLoad: function (options) {
    // 页面初始化 options为页面跳转所带来的参数
    console.log('Enter login page...');

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

  },
  wxLogin: function () {
    var that = this;
    AV.User.loginWithWeapp().then(user => {
      user.set('userName', that.data.userName);
      user.set('userId', that.data.userId);
      user.set('userType', that.data.userType[that.data.index]);
      user.set('register', true);
      user.save().then(user => {
        app.globalData.user = user.toJSON();
        console.log('AV.User.loginWithWeapp() returned user:', user)
        wx.switchTab({
          url: '../index/index',
          success: function (res) {
            console.log("redirected to index page..")
          },
          fail: function () {
            console.log('redirect fail!')
          },
          complete: function () {
            // complete
          }
        });
      });

    }).catch(console.error);

  }
})