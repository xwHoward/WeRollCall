const AV = require('../../lib/leancloud-storage');
var app = getApp();    
// const user = AV.User.current();
Page({
  data: {
    timeStart: '08:00',
    timeEnd: '09:35',
    weekdays: [
      {name: 'MON', value: '周一'},
      {name: 'TUE', value: '周二'},
      {name: 'THI', value: '周三'},
      {name: 'WED', value: '周四'},
      {name: 'FRI', value: '周五'},
      {name: 'SUN', value: '周六'},
    ]
  },
  bindTimeStartChange: function(e) {
    this.setData({
      timeStart: e.detail.value
    })
  },
  bindTimeEndChange: function(e) {
    this.setData({
      timeEnd: e.detail.value
    })
  },
  formSubmit: function(e) {
    var data = e.detail.value;
    console.log('form发生了submit事件，携带数据为：', data)
    var COURSE = AV.Object.extend('COURSE');
    var course = new COURSE();
    course.set('courseName',data.courseName);
    course.set('courseAddr',data.courseAddr);
    course.set('courseTimeEnd',data.courseTimeEnd);
    course.set('courseTimeStart',data.courseTimeStart);
    console.log(app.globalData.user)
    course.set('teacher',app.globalData.user);
    course.set('weekdays',data.weekdays);
  },
  onLoad: function () {

  }
})
