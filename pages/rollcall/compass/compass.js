const AV = require('../../../lib/leancloud-storage');
var Promise = require("../../../lib/es6-promise.min");
var ROLLCALL = AV.Object.extend('ROLLCALL');
var app = getApp();
Page({
  data: {
    direction: 0,
    template: 'compass-panel',
    bgc: '#09BB07',
    countdownEnd: true,
    manuAdd: false,
    timeLeft: '0:0',
    signedInStudents: [],
    onLeaveStudents: [],
    signedInStudentsNum: 0,
    studentSum: 0
  },
  onLoad: function (options) {
    console.log(options)
    var that = this;
    this.setData({
      courseId: options.courseId,
      userType: options.userType
    });
    wx.onCompassChange(function (res) {
      that.setData({
        direction: res.direction.toFixed(2)
      });
    });
    // setInterval(function(){
    //   that.setData({
    //     direction: (Math.random()*360).toFixed(2)
    //   })
    // },5000)

  },
  createRollcall: function () {
    var that = this;
    that.setData({
      template: 'countdown'
    });
    //发布点名
    var rollcall = new ROLLCALL();
    var teacher = AV.Object.createWithoutData('_User', app.globalData.user.objectId);
    rollcall.set('teacher', teacher);
    var course = AV.Object.createWithoutData('COURSE', that.data.courseId);
    rollcall.set('course', course);
    rollcall.set('type', 'compass');
    rollcall.set('teacherAngle', that.data.direction);
    rollcall.set('students', []);
    var stuA = AV.Object.createWithoutData('_User', '587b6dd15c497d0058a39e76');//测试数据
    rollcall.addUnique('students', stuA);//测试数据
    rollcall.set('timeout', 3);//暂时把所有点名有效时间定为3分钟
    rollcall.save()
      .then(function (rc) {
        console.log('新增rollcall行成功，rollcall行注入course成功');
        var course = AV.Object.createWithoutData('COURSE', that.data.courseId);
        var rollcall = AV.Object.createWithoutData('ROLLCALL', rc.id);
        course.addUnique('rollcalls', rollcall);
        course.save().then(function (c) {
          console.log('course行注入rollcall成功');
        });
        var teacher = AV.Object.createWithoutData('_User', app.globalData.user.objectId);
        teacher.addUnique('rollcalls', rollcall);
        teacher.save().then(function (t) {
          console.log('user行注入rollcall成功');
        });
        that.setData({
          template: 'countdown',
          rollcallId: rc.id
        });
        that.startCountdown(2, 59);
        var intv = setInterval(function () {
          if (that.data.countdownEnd) {
            that.updateStatus();
          } else {
            //对本次点名的请假记录做清理
            //向今日有效请假记录插入标记字段
            var today = (new Date()).toLocaleDateString();
            //对符合日期的请假做标记adopted字段
            var leaveQuery = new AV.Query('LEAVE');
            leaveQuery.equalTo('date', today);
            leaveQuery.include('student');
            leaveQuery.find().then(function (lvs) {
              console.log('今日请假记录：', lvs)
              for (var i = 0; i < lvs.length; i++) {
                var lv = AV.Object.createWithoutData('LEAVE', lvs[i].id);
                lv.set('adopted', true);
                lv.save().then();
                var onLeaveStudents = [];
                onLeaveStudents.push(lvs[i].get('student'));
              }
              console.log("onLeaveStudents:", onLeaveStudents)
              that.setData({
                onLeaveStudents: onLeaveStudents
              });
            });
            clearInterval(intv);
          }
        }, 5000);
      })
      .catch(console.error);
  },
  startCountdown: function (m, s) {
    var that = this;
    var intv = setInterval(function () {
      if (s >= 0) {
        that.setData({
          timeLeft: m + ':' + s--
        });
      } else {
        m--;
        s = 59;
        if (m < 0) {
          clearInterval(intv);
          //定时结束
          that.setData({
            bgc: '#f76060',
            countdownEnd: false
          });
          wx.showToast({
            title: '点名结束',
            icon: 'success',
            duration: 3000
          });
        } else {
          that.setData({
            timeLeft: m + ':' + s--
          });
        }
      }
    }, 1000);
  },
  //初始化学生签到界面
  initSignInData: function (rcId) {
    var that = this;
    var rollcallQuery = new AV.Query('ROLLCALL');
    rollcallQuery.get(rcId).then(function (rc) {
      console.log('rollcall:', rc)
      var timeStart = rc.get('createdAt');
      var timeout = rc.get('timeout');
      var now = new Date();
      var timeLeft = timeStart - now + timeout * 60000;
      if (timeLeft <= 0) {
        //点名已结束
        that.setData({
          bgc: '#f76060',
          countdownEnd: false
        });
        wx.showToast({
          title: '点名已结束',
          icon: 'success',
          duration: 3000
        });
      } else {
        //点名正在进行中
        var min = (new Date(timeLeft)).getMinutes();
        var sec = (new Date(timeLeft)).getSeconds();
        that.startCountdown(min, sec);
      }
    });
  },
  //更新学生签到情况
  updateStatus: function () {
    var that = this;
    //更新签到表
    var rollcallQuery = new AV.Query('ROLLCALL');
    rollcallQuery.include('students');
    rollcallQuery.get(that.data.rollcallId).then(function (rc) {
      var students = rc.get('students');
      that.setData({
        signedInStudents: students,
        signedInStudentsNum: students.length,
      });
    });
    //更新签到进度
    var courseQuery = new AV.Query('COURSE');
    courseQuery.get(that.data.courseId).then(function (c) {
      var sum = c.attributes.students.length;
      that.setData({
        studentSum: sum
      });
    });
  },
  signIn: function () {
    var that = this;
    console.log('that.data.rollcallId:',that.data.rollcallId)
    var rollcallQuery = new AV.Query('ROLLCALL');
    rollcallQuery.get(that.data.rollcallId).then(function (rc) {
      console.log("rollcall's angle, student's angle:", rc.attributes.teacherAngle, that.data.direction)
      var teacherAngle = rc.attributes.teacherAngle;
      var targetAngle = teacherAngle > 180 ? (teacherAngle - 180) : (teacherAngle + 180);
      console.log('targetAngle:', targetAngle);
      if (Math.abs(targetAngle - that.data.direction) <= 10) {
        //签到成功
        var rollcall = AV.Object.createWithoutData('ROLLCALL', that.data.rollcallId);
        var student = AV.Object.createWithoutData('_User', app.globalData.user.objectId);
        rollcall.addUnique('students', student);
        rollcall.save().then(function (rc) {
          console.log('rollcall表注入签到学生成功')
          var rollcall = AV.Object.createWithoutData('ROLLCALL', rc.id);
          var self = AV.Object.createWithoutData('_User', app.globalData.user.objectId);
          self.addUnique('rollcalls', rollcall);
          self.save().then(function (stu) {
            console.log('user表注入rollcall成功')
          });
          wx.showModal({
            title: '签到成功',
            content: '点击确定返回主页',
            showCancel: false,
            confirmText: '返回主页',
            confirmColor: '#3CC51F',
            success: function (res) {
              wx.navigateBack();
            }
          });
        })
      } else {
        console.log('签到失败！')
      }
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