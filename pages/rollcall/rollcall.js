const AV = require('../../lib/leancloud-storage');
var app = getApp();  
Page({
  data:{
    tpl: ""
  },
  //定时点名
  timeout: function(){
    
  },
  // 地理位置点名
  location: function(){
    wx.navigateTo({
      url: 'location/location'
    })
  },
  onLoad:function(options){
    // 页面初始化 options为页面跳转所带来的参数
    if(app.globalData.user.userType == '老师'){
            this.setData({
                tpl: 'rollcall'
            });
        }else{
            this.setData({
                tpl: 'sign-in'
            });
        }
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