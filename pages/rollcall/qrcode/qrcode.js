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
    template: 'create',
    timeLeft: '2:0',
    signedInStudents: []
  },
  onLoad: function (options) {
    // 页面初始化 options为页面跳转所带来的参数
    console.log(options)
    this.setData({
      courseId: options.courseId
    });
    var res = wx.getSystemInfoSync();
    var size = {
      w: res.windowWidth / 1.25,
      h: res.windowWidth / 1.25
    };//动态设置画布大小
    var token = options.courseId;
    this.createQrCode(token, "qrcode", size.w, size.h);
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
    console.log(app.globalData.user)
    var teacher = AV.Object.createWithoutData('_User', app.globalData.user.objectId);
    rollcall.set('teacher', teacher);
    var course = AV.Object.createWithoutData('COURSE', that.data.courseId);
    rollcall.set('course', course);
    rollcall.set('type', 'qrcode');
    rollcall.set('students', []);
    var stuA = AV.Object.createWithoutData('_User', '587b6dd15c497d0058a39e76');
    rollcall.addUnique('students', stuA);
    rollcall.set('timeout', this.data.timeout);
    rollcall.save()
      .then(function (rc) {
        console.log('rollcall:', rc);
        that.setData({
          template: 'countdown',
          rollcallId: rc.id
        });
        that.startCountdown(that.data.timeout);
      })
      .catch(console.error);
  },
  startCountdown: function (m) {
    this.updateStatus();
    var that = this;
    m--;
    let s = 9;
    var intv = setInterval(function () {
      if (s >= 0) {
        that.setData({
          timeLeft: m + ':' + s--
        });
      } else {
        that.updateStatus();
        m--;
        s = 9;
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
  //更新学生签到情况
  updateStatus: function () {
    var that = this;
    //更新签到表
    var rollcallQuery = new AV.Query('ROLLCALL');
    rollcallQuery.include('students');
    rollcallQuery.get(that.data.rollcallId).then(function (rc) {
      console.log(rc)
      var students = rc.get('students');
      that.setData({
        signedInStudents: students,
        signedInStudentsNum: students.length,
      });
    });
    //更新签到进度
    var courseQuery = new AV.Query('COURSE');
    courseQuery.get(that.data.courseId).then(function (c) {
      console.log(c)
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