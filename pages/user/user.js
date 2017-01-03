const AV = require('../../lib/leancloud-storage');
var app = getApp();
Page({
  data:{
    userInfo:{}
  },
  onLoad:function(options){
    var that = this;
    console.log('Enter user page..')
    // 页面初始化 options为页面跳转所带来的参数
    
    


    // 获得当前登录用户
    // const user = AV.User.current();
    // // 调用小程序 API，得到用户信息
    // wx.getUserInfo({
    //   success: ({userInfo}) => {
    //     // 更新当前用户的信息
    //     user.set(userInfo).save().then(user => {
    //       // 成功，此时可在控制台中看到更新后的用户信息
    //       this.globalData.user = user.toJSON();
    //     }).catch(console.error);
    //   }
    // });
    // this.setData({
    //   userInfo: AV.User.current()
    // });

    // if(app.globalData.user == null){
        // console.log('No user info in App, redirecting To login page..')
        // wx.redirectTo({
        //   url: '../login/login',
        //   success: function(res){
        //     console.log("redirected..")
        //   },
        //   fail: function() {
        //     console.log('redirect fail!')
        //   },
        //   complete: function() {
        //     // complete
        //   }
        // })
    // }else{
      console.log("app.globalData.user exists!")
      this.setData({
        userInfo:app.globalData.user
      });
      console.log("user page data(userInfo):");
      console.log(that.data.userInfo);
    // }
  },
  onReady:function(){
    // 页面渲染完成
  },
  onShow:function(){
    // 页面显示
  },
  onHide:function(){
    // 页面隐藏
  },
  onUnload:function(){
    // 页面关闭
  }
})