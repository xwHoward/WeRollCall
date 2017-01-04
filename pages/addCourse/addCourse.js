const AV = require('../../lib/leancloud-storage');
var COURSE = AV.Object.extend('COURSE');
var app = getApp();    
Page({
  data: {
    template: 'search-course',
    tplData: {
      timeStart: '08:00',
      timeEnd: '09:35',
      weekdays: [
        {name: '周一', value: '周一'},
        {name: '周二', value: '周二'},
        {name: '周三', value: '周三'},
        {name: '周四', value: '周四'},
        {name: '周五', value: '周五'},
        {name: '周六', value: '周六'},
      ]
    }
  },
  bindTimeStartChange: function(e) {
    this.setData({
      'tplData.timeStart': e.detail.value
    });
  },
  bindTimeEndChange: function(e) {
    this.setData({
      'tplData.timeEnd': e.detail.value
    });
  },
  formSubmit: function(e) {
    var data = e.detail.value;
    var course = new COURSE();
    course.set('courseName',data.courseName);
    course.set('courseAddr',data.courseAddr);
    course.set('courseTimeEnd',data.courseTimeEnd);
    course.set('courseTimeStart',data.courseTimeStart);
    var teacher = AV.Object.createWithoutData('_User', app.globalData.user.objectId);
    course.set('teacher',teacher);
    course.set('weekdays',data.weekdays);
    course.save().then(function (course) {
      console.log("add course success!");
      //添加课程成功，继续添加或返回
      wx.showModal({
        title: '添加课程成功',
        icon: 'success',
        content: '您可以继续添加课程或者返回主页',
        cancelText: '继续添加',
        cancelColor: '#1AAD16',
        confirmText: '返回主页',
        confirmColor: '#3CC51F',
        success: function(res) {
          if (res.confirm) {//返回主页
            console.log('返回主页')
            wx.navigateBack();
          } else if (res.cancel){
            console.log('继续添加')
            wx.hideToast();
          }
        }
      });
    }, function (error) {
      console.error(error);
    });
  },
  chooseCourse: function(e){
    var student = AV.Object.createWithoutData('_User', app.globalData.user.objectId);
    var course = AV.Object.createWithoutData('COURSE', e.target.dataset.course.objectId);
    student.addUnique('coursesChosen', course);
    student.save().then(function(stu){
      console.log('choose course success!')
      wx.showModal({
        title: '添加课程成功',
        icon: 'success',
        content: '您可以继续添加课程或者返回主页',
        cancelText: '继续添加',
        cancelColor: '#1AAD16',
        confirmText: '返回主页',
        confirmColor: '#3CC51F',
        success: function(res) {
          if (res.confirm) {//返回主页
            console.log('返回主页')
            wx.navigateBack();
          } else if (res.cancel){
            console.log('继续添加')
            wx.hideToast();
          }
        }
      });
    }, function (error) {
      console.error(error);
    });
  },
  searchCourse: function(e) {
    var that = this;
    var query = new AV.Query('COURSE');
    query.contains('courseName', e.detail.value);
    query.include('teacher');
    query.include('teacher.userName');
    query.find().then(function (results) {
      for (var i = 0; i < results.length; i++) {
          var result = results[i];
          // 并不需要网络访问
          // var courseName = result.get('courseName');
          var teacher = result.get('teacher');
          var teacherName = teacher.get('userName');
          results[i].attributes.teacherName = teacherName;
      }
      that.setData({
        'tplData.results': results
      });
    }, function (error) {
      console.log(error)
    });
  },
  onLoad: function () {
    this.setData({
      'tplData.courseTeacher': app.globalData.user.userName
    })
  }
})
