// pages/index/stat/stat.js
const AV = require('../../../lib/leancloud-storage');
var app = getApp();
Page({
  data: {
    attend: 0,
    leave: 1,//假数据
    absence: 0,
    total: 0,
    teacher: '王老师',
    student: '李同学',
    stuId: 20132074,
    courseName: '数据挖掘'
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
      for(var i = 0; i<rollcalls.length;i++){
        targetStr += rollcalls[i].id;
      }
      console.log(targetStr)
      var attend = 0;
      console.log(myRollcalls)
      for(var i = 0; i<myRollcalls.length;i++){
        var id = myRollcalls[i].objectId
        if(targetStr.indexOf(id)>0){
          attend++;
        }
      }
      var leave = 1;//假数据
      that.setData({
        total: rollcalls.length,
        courseName: courseName,
        attend: attend,
        absence: rollcalls.length-attend-leave
      });
      // var userQuery = new AV.Query('_User');

    }, function (error) {
      // 异常处理
      console.log(error);
    });
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