const AV = require('../../lib/leancloud-storage');
var COURSE = AV.Object.extend('COURSE');
var app = getApp();
var debug = app.globalData.debug;
Page({
  data: {
    template: 'add-course',
    tplData: {
      timeStart: '08:00',
      timeEnd: '09:35',
      weekdays: [
        { name: '周一', value: '周一' },
        { name: '周二', value: '周二' },
        { name: '周三', value: '周三' },
        { name: '周四', value: '周四' },
        { name: '周五', value: '周五' },
        { name: '周六', value: '周六' },
      ]
    }
  },
  bindTimeStartChange: function (e) {
    this.setData({
      'tplData.timeStart': e.detail.value
    });
  },
  bindTimeEndChange: function (e) {
    this.setData({
      'tplData.timeEnd': e.detail.value
    });
  },
  formSubmit: function (e) {
    //教师身份对应添加新课程
    var data = e.detail.value;
    var course = new COURSE();
    course.set('courseName', data.courseName);
    course.set('courseAddr', data.courseAddr);
    course.set('students', []);
    course.set('courseTimeEnd', data.courseTimeEnd);
    course.set('courseTimeStart', data.courseTimeStart);
    var teacher = AV.Object.createWithoutData('_User', app.globalData.user.objectId);
    course.set('teacher', teacher);
    course.set('weekdays', data.weekdays);
    course.save().then(function (course) {
      var teacher = AV.Object.createWithoutData('_User', app.globalData.user.objectId);
      teacher.addUnique('courses', course).save(function () {
        wx.showModal({
          title: '添加课程成功',
          content: '您可以继续添加课程或者返回主页',
          cancelText: '继续添加',
          cancelColor: '#1AAD16',
          confirmText: '返回主页',
          confirmColor: '#3CC51F',
          success: function (res) {
            if (res.confirm) {//返回主页
              debug && console.log('返回主页')
              wx.navigateBack();
            } else if (res.cancel) {
              wx.hideToast();
            }
          }
        });
      });
      //添加课程成功，继续添加或返回
    }, function (error) {
      console.error(error);
    });
  },
  chooseCourse: function (e) {
    //学生身份对应选课
    debug && console.log(e.target.dataset)
    var course = AV.Object.createWithoutData('COURSE', e.target.dataset.courseId);
    var student = AV.Object.createWithoutData('_User', app.globalData.user.objectId);
    student.addUnique('coursesChosen', course);
    student.save()
      .then(function (stu) {
        debug && console.log('choose course success!', stu)
        var course = AV.Object.createWithoutData('COURSE', e.target.dataset.courseId);
        var student = AV.Object.createWithoutData('_User', app.globalData.user.objectId);
        course.addUnique('students', student);
        course.save().then(function (c) {
          debug && console.log(c)
        }, function (error) {
          debug && console.log(error)
        });
        wx.showModal({
          title: '添加课程成功',
          content: '您可以继续选择课程或者返回主页',
          cancelText: '继续添加',
          cancelColor: '#1AAD16',
          confirmText: '返回主页',
          confirmColor: '#3CC51F',
          success: function (res) {
            if (res.confirm) {//返回主页
              debug && console.log('返回主页')
              wx.navigateBack();
            } else if (res.cancel) {
              wx.hideToast();
            }
          },
          fail: function (res) {
            debug && console.log(res)
          }
        });
        // });
      }, function (error) {
        console.error(error);
      });
  },
  searchCourse: function (e) {
    var that = this;
    wx.showNavigationBarLoading();
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
      wx.hideNavigationBarLoading();
    }, function (error) {
      debug && console.log(error)
    });
  },
  onLoad: function () {
    if (app.globalData.user.userType == "老师") {
      this.setData({
        'template': 'add-course',
        'tplData.courseTeacher': app.globalData.user.userName
      });
    } else {
      this.setData({
        'template': 'search-course'
      });
    }
  }
})
