const AV = require('../../../lib/leancloud-storage');
var QR = require("../../../lib/qrcode.js");
var ROLLCALL = AV.Object.extend('ROLLCALL');
var app = getApp();
Page({
  data: {
    imagePath: '',
    timeout: 2,
    bgc: '#09BB07',
    countdownEnd: true,
    manuAdd: false,
    template: '',
    timeLeft: '0:0',
    signedInStudents: [],
    onLeaveStudents: [],
    signedInStudentsNum: 0,
    studentSum: 0
  },
  onLoad: function (options) {
    // 页面初始化 options为页面跳转所带来的参数
    console.log('页面初始化 options为页面跳转所带来的参数:', options)
    if (options.userType == 'student') {
      //学生身份，对应签到界面
      this.setData({
        template: 'signin',
        rollcallId: options.rollcallId
      });
      this.initSignInData(options.rollcallId);
    } else {
      //教师身份，对应创建点名
      this.setData({
        template: 'create',
        courseId: options.courseId
      });
      var res = wx.getSystemInfoSync();
      var size = {
        w: res.windowWidth / 1.25,
        h: res.windowWidth / 1.25
      };//动态设置画布大小
      var token = options.courseId;
      this.createQrCode(token, "qrcode", size.w, size.h);
    }
  },
  createQrCode: function (url, canvasId, cavW, cavH) {
    //调用插件中的draw方法，绘制二维码图片
    QR.qrApi.draw(url, canvasId, cavW, cavH);
    var that = this;
    //二维码生成之后调用canvasToTempImage();延迟3s，否则获取图片路径为空
    var st = setTimeout(function () {
      that.canvasToTempImage();
      clearTimeout(st);
    }, 3000);

  },
  timeoutChange: function (e) {
    this.setData({
      timeout: e.detail.value
    });
  },
  //获取临时缓存照片路径，存入data中
  canvasToTempImage: function () {
    var that = this;
    wx.canvasToTempFilePath({
      canvasId: 'qrcode',
      success: function (res) {
        console.log(res)
        var tempFilePath = res.tempFilePath;
        console.log(tempFilePath);
        that.setData({
          imagePath: tempFilePath,
        });
      },
      fail: function (res) {
        console.log(res);
      }
    });
  },
  //点击图片进行预览，长按保存分享图片
  previewImg: function (e) {
    var that = this;
    wx.showToast({
      title: '正在生成二维码图片',
      icon: 'loading',
      duration: 3000
    })
    var st = setTimeout(function () {
      var img = that.data.imagePath
      console.log(img)
      wx.previewImage({
        current: img, // 当前显示图片的http链接
        urls: [img] // 需要预览的图片http链接列表
      })
    }, 3000);
  },
  //发布点名
  createRollcall: function () {
    var that = this;
    var rollcall = new ROLLCALL();
    var teacher = AV.Object.createWithoutData('_User', app.globalData.user.objectId);
    rollcall.set('teacher', teacher);
    var course = AV.Object.createWithoutData('COURSE', that.data.courseId);
    rollcall.set('course', course);
    rollcall.set('type', 'qrcode');
    rollcall.set('done', false);
    rollcall.set('students', []);
    var stuA = AV.Object.createWithoutData('_User', '587b6dd15c497d0058a39e76');//测试数据
    rollcall.addUnique('students', stuA);//测试数据
    rollcall.set('timeout', this.data.timeout);
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
        that.startCountdown(that.data.timeout - 1, 59).then(function () {
          //倒计时结束
          rollcall.set('done',true).save().then(function(rc){
            console.log('rollcall terminated, rollcall:',rc)
          });
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
        });
        var intv = setInterval(function () {
          if (!that.data.countdownEnd) {
            that.updateStatus();
          } else {
            clearInterval(intv);
          }
        }, 5000);
      })
      .catch(console.error);
  },
  startCountdown: function (m, s) {
    var that = this;
    return new Promise(function (resolve, reject) {
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
            resolve();
          } else {
            that.setData({
              timeLeft: m + ':' + s--
            });
          }
        }
      }, 1000);
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
  addToNamelist: function () {
    this.setData({
      manuAdd: true
    });

  },
  inputStuId: function (e) {
    this.setData({
      stuId: e.detail.value
    })
  },
  manuAdd: function () {
    var that = this;
    console.log(this.data.stuId)
    //搜索学号对应的学生用户
    var studentQuery = new AV.Query('_User');
    studentQuery.equalTo('userId', this.data.stuId);
    studentQuery.find()
      .then(function (stu) {
        if (stu.length > 0) {
          var rollcall = AV.Object.createWithoutData('ROLLCALL', that.data.rollcallId);
          var student = AV.Object.createWithoutData('_User', stu[0].id);
          rollcall.addUnique('students', student);
          rollcall.save().then(function (rc) {
            wx.showToast({
              title: '添加成功',
              icon: 'success',
              duration: 2000
            });
            that.updateStatus();
          });
        } else {
          wx.showModal({
            title: '没有找到匹配的学生信息',
            showCancel: false,
            content: '请确认学号信息准确无误',
            confirmText: '确认',
            confirmColor: '#3CC51F',
            success: function (res) {
              wx.hideToast();
            }
          });
        }
      }, function (error) {
        console.log(error)
      });
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
      console.log(timeStart - now + timeout * 60000)
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
  //扫码签到
  qrcodeSignIn: function () {
    var that = this;
    wx.scanCode({
      success: (res) => {
        var str = res.result;
        var courseId = str.slice(str.lastIndexOf('/') + 1);
        console.log('courseId:', courseId);
        var rollcallQuery = new AV.Query('ROLLCALL');
        rollcallQuery.get(that.data.rollcallId).then(function (rc) {
          console.log("rollcall's course id, scanned id:", rc.attributes.course.id, courseId)
          if (rc.attributes.course.id == courseId) {
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
                  console.log('返回主页')
                  wx.navigateBack();
                }
              });
            })
          } else {
            console.log('签到失败！')
            wx.showModal({
              title: '签到失败！',
              content: '请检查二维码是否正确，或重新扫码',
              showCancel: false,
              confirmText: '确定',
              confirmColor: '#3CC51F',
              success: function (res) {

              }
            });
          }
        });
      }
    })
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