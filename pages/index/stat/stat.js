// pages/index/stat/stat.js
const AV = require('../../../lib/leancloud-storage');
var app = getApp();
var LEAVE = AV.Object.extend('LEAVE');
 
Page({
  data: {
    attend: 7,
    leave: 1,//假数据
    absence: 2,
    total: 10,
    teacher: '王德福',
    student: '李同学',
    stuId: 20132074,
    courseName: '数据挖掘',
    date: (new Date()).toLocaleDateString(),
    tempFilePath: null,
    reason: ""
  },
  onLoad: function (options) {
    console.log(options)
    this.getCourseInfo(options.courseId);
  },
  //初始化点名总数及课程信息
  getCourseInfo: function (courseId) {
    var that = this;
    var myRollcalls = app.globalData.user.rollcalls;
    var courseQuery = new AV.Query('COURSE');
    // courseQuery.include('rollcalls');
    courseQuery.get(courseId).then(function (crs) {
      var courseName = crs.get('courseName');
      var rollcalls = crs.get('rollcalls');
      var targetStr = '';
      for (var i = 0; i < rollcalls.length; i++) {
        targetStr += rollcalls[i].id;
      }
      console.log(targetStr)
      var attend = 0;
      console.log(myRollcalls)
      for (var i = 0; i < myRollcalls.length; i++) {
        var id = myRollcalls[i].objectId
        if (targetStr.indexOf(id) > 0) {
          attend++;
        }
      }
      var leave = 1;//假数据
      that.setData({
        total: rollcalls.length,
        courseName: courseName,
        attend: attend,
        absence: rollcalls.length - attend - leave
      });
      // var userQuery = new AV.Query('_User');

    }, function (error) {
      // 异常处理
      console.log(error);
    });
  },
  //上传图片
  uploadFile: function () {
    var that = this;
    wx.chooseImage({
      count: 1, // 默认9
      sizeType: ['original', 'compressed'], // 可以指定是原图还是压缩图，默认二者都有
      sourceType: ['album', 'camera'], // 可以指定来源是相册还是相机，默认二者都有
      success: function (res) {
        // 返回选定照片的本地文件路径列表，tempFilePath可以作为img标签的src属性显示图片
        var tempFilePath = res.tempFilePaths[0]
        console.log(tempFilePath);
        that.setData({
          tempFilePath: tempFilePath
        });
      }
    })
  },
  //长按删除已选图片
  deletePic: function () {
    var that = this;
    wx.showModal({
      title: '删除已选图片',
      content: '确认删除当前已选图片吗？',
      success: function (res) {
        if (res.confirm) {
          that.setData({
            tempFilePath: null
          });
        }
      }
    })
  },
  //向老师发送假条
  sendMessage: function(){
    var leave = new LEAVE();
    var student = AV.User.current();
    leave.set('student',student);

    //从这里开始。。。











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
  }
})