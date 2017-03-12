// pages/index/stat/stat.js
const AV = require('../../../lib/leancloud-storage');
var Promise = require("../../../lib/es6-promise.min");
var app = getApp();
var LEAVE = AV.Object.extend('LEAVE');
var teacher = {};
var course = {};
var date = (new Date()).toLocaleDateString();
var debug = app.globalData.debug;
Page({
  data: {
    attend: 0,
    leave: 0,
    absence: 0,
    attendRate: 0,
    leaveRate: 0,
    absenceRate: 0,
    total: 0,
    teacher: '',
    student: '',
    stuId: '',
    courseName: '',
    date: date,
    tempFilePath: null,
    reason: "",
    leaveNoteShow: false,
    leaveNoteSend: false,
    template: '',
    unreadLeaves: []
  },
  refresh: function () {
    this.initLeaveNotes(this.data.courseId);
  },
  onLoad: function (options) {
    this.setData({
      courseId: options.courseId
    });
    debug && console.log(app.globalData.user.userType)
    if (app.globalData.user.userType === '学生') {
      debug && console.log("student")
      this.setData({
        template: 'student'
      });
      this.getCourseInfo(options.courseId);
    } else {
      debug && console.log("teacher")
      this.setData({
        template: 'teacher'
      });
      this.initLeaveNotes(options.courseId);
    }
  },
  // 加载请假条列表
  initLeaveNotes: function (courseId) {
    wx.showToast({
      title: '获取课程信息...',
      icon: 'loading',
      mask: true
    });
    var that = this;
    var courseQuery = new AV.Query('COURSE');
    courseQuery.include('leaves');
    courseQuery.get(courseId).then(function (crs) {
      debug && console.log("course:", crs)
      course = crs.toJSON();
      var leaves = crs.get('leaves');
      debug && console.log('leaves of this course:', leaves)
      var unreadLeaveNum = 0;
      var unreadLeaves = leaves.filter(function (lv) {
        return lv.get('read') === false;
      });
      debug && console.log('unreadLeaves:', unreadLeaves)
      var unreadLeavesObjs = [];
      var unreadLeavesPrms = unreadLeaves.map(function (el) {
        unreadLeaveNum++;
        return new Promise(function (resolve, reject) {
          var leaveQuery = new AV.Query('LEAVE');
          leaveQuery.include('student');
          leaveQuery.get(el.id).then(function (lv) {
            //遍历unreadLeave获取student字段，重新拼装unreadLeaves
            var student = lv.get('student');
            var img = lv.get('image');
            var imgSrc = '';
            if (img) {
              imgSrc = img.get('url');
            }
            debug && console.log('imgSrc:', imgSrc)
            var unreadLeave = {
              id: lv.id,
              reason: lv.get('reason'),
              studentName: student.get('userName'),
              studentId: student.get('userId'),
              date: lv.get('date'),
              imgSrc: imgSrc
            }
            unreadLeavesObjs.push(unreadLeave);
            resolve();
          }).catch(function (error) {
            reject(error);
          });
        });
      });
      Promise.all(unreadLeavesPrms).then(function () {
        debug && console.log('unreadLeavesObjs:', unreadLeavesObjs)
        wx.hideToast();
        that.setData({
          unreadLeaves: unreadLeavesObjs
        });
      });
    }, function (error) {
      // 异常处理
      debug && console.log(error);
    });
  },
  //初始化点名总数、出勤次数及课程信息
  getCourseInfo: function (courseId) {
    wx.showToast({
      title: '获取课程信息...',
      icon: 'loading',
      mask: true
    });
    var that = this;
    var myRollcalls = app.globalData.user.rollcalls;
    var courseQuery = new AV.Query('COURSE');
    courseQuery.include('teacher');
    courseQuery.include('leaves');
    courseQuery.get(courseId).then(function (crs) {
      course = crs.toJSON();
      var courseName = course.courseName;
      var rollcalls = course.rollcalls;
      teacher = course.teacher;
      var targetRollcallStr = '';
      for (var i = 0; i < rollcalls.length; i++) {
        targetRollcallStr += rollcalls[i].objectId;
      }
      var attend = 0;
      debug && console.log("myRollcalls:", myRollcalls)
      for (var i = 0; i < myRollcalls.length; i++) {
        var id = myRollcalls[i].objectId
        if (targetRollcallStr.indexOf(id) >= 0) {
          attend++;
        }
      }
      //请假次数
      //1.获取用户请假记录
      var myLeaves = app.globalData.user.leaves;
      debug && console.log("myLeaves:", myLeaves)
      var myAdoptedLeaves = myLeaves.filter(function (lv) {
        return lv.adopted;
      });
      debug && console.log("myAdoptedLeaves:", myAdoptedLeaves)
      //2.获取指定课程请假记录
      var leaves = course.leaves;
      debug && console.log("myLeaves, course's leaves", myLeaves, leaves)
      //3.数据合并比较
      var targetLeaveStr = '';
      for (var i = 0; i < leaves.length; i++) {
        targetLeaveStr += leaves[i].objectId;
      }
      var leaveSum = 0;
      for (var i = 0; i < myAdoptedLeaves.length; i++) {
        var id = myAdoptedLeaves[i].objectId;
        if (targetLeaveStr.indexOf(id) >= 0) {
          leaveSum++;
        }
      }
      that.setData({
        total: rollcalls.length,
        courseName: courseName,
        teacher: teacher.userName,
        student: app.globalData.user.userName,
        attend: attend,
        absence: rollcalls.length - attend - leaveSum,
        stuId: app.globalData.user.userId,
        leave: leaveSum,
        attendRate: (attend / rollcalls.length * 100).toFixed(2),
        absenceRate: ((rollcalls.length - attend - leaveSum) / rollcalls.length * 100).toFixed(2),
        leaveRate: (leaveSum / rollcalls.length * 100).toFixed(2)
      });
      wx.hideToast();
    }, function (error) {
      // 异常处理
      debug && console.log(error);
    });
  },
  //选择图片
  chooseImage: function () {
    var that = this;
    wx.chooseImage({
      count: 1, // 默认9
      sizeType: ['original', 'compressed'], // 可以指定是原图还是压缩图，默认二者都有
      sourceType: ['album', 'camera'], // 可以指定来源是相册还是相机，默认二者都有
      success: function (res) {
        // 返回选定照片的本地文件路径列表，tempFilePath可以作为img标签的src属性显示图片
        var tempFilePath = res.tempFilePaths[0]
        debug && console.log("tempFilePath:", tempFilePath);
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
  //上传图片文件
  uploadFile: function () {
    var that = this;
    return new Promise(function (resolve, reject) {
      var fileName = that.data.tempFilePath;
      new AV.File(fileName, {
        blob: {
          uri: that.data.tempFilePath,
        },
      }).save().then(function (file) {
        // 文件保存成功
        debug && console.log("file id:", file.id);
        resolve(file.id);

      }).catch(function (error) {
        reject(error);
      });
    });
  },
  //向老师发送假条
  sendMessage: function () {
    var that = this;
    app.globalData.leaveTag.forEach(function (el, index) {
      if (el.courseId === that.data.courseId) {
        //本门课程已经请过假
        wx.showModal({
          title: '已经请过假啦',
          content: '同一门课程不可以多次请假哦！',
          showCancel: false,
          confirmText: '知道了',
          confirmColor: '#3CC51F',
          success: function (res) {
            return 0;
          }
        });
      }
    });
    wx.showToast({
      title: '发送中...',
      icon: 'loading',
      mask: true
    })
    //带图片文件
    if (that.data.tempFilePath !== null) {
      debug && console.log("带图片文件")
      that.uploadFile()
        .then(function (fileId) {
          debug && console.log(fileId);
          //新增LEAVE表行数据
          var leave = new LEAVE();
          var studentObj = AV.Object.createWithoutData('_User', app.globalData.user.objectId);
          var teacherObj = AV.Object.createWithoutData('_User', teacher.objectId);
          var courseObj = AV.Object.createWithoutData('COURSE', course.objectId);
          var fileObj = AV.Object.createWithoutData('_File', fileId);
          leave.set('student', studentObj);
          leave.set('teacher', teacherObj);
          leave.set('date', date);
          leave.set('reason', that.data.reason);
          leave.set('course', courseObj);
          leave.set('image', fileObj);
          leave.set('read', false);
          leave.set('adopted', false);
          leave.set('agree', false);
          leave.save()
            .then(function (res) {
              that.setData({
                leaveNoteSend: true
              });
              //COURSE表leaves字段追加记录
              var courseClass = AV.Object.createWithoutData('COURSE', course.objectId);
              var leaveClass = AV.Object.createWithoutData('LEAVE', res.id);
              courseClass.addUnique('leaves', leaveClass);
              courseClass.save().then(function () {
                //_USER表leaves字段追加记录
                var userReg = AV.Object.createWithoutData('_User', app.globalData.user.objectId);
                var leaveReg = AV.Object.createWithoutData('LEAVE', res.id);
                userReg.addUnique('leaves', leaveReg);
                userReg.save().then(function () {
                  wx.hideToast();
                });
              });
            })
            .catch(function (error) {
              //请假记录入库失败
              var file = AV.File.createWithoutData(fileId);
              file.destroy().then(function (success) {
                debug && console.log("文件删除成功")
              }, function (error) {
              });
            });
        });
    } else {
      //没有图片信息
      debug && console.log("没有图片信息")
      var leave = new LEAVE();
      var studentObj = AV.Object.createWithoutData('_User', app.globalData.user.objectId);
      var teacherObj = AV.Object.createWithoutData('_User', teacher.objectId);
      var courseObj = AV.Object.createWithoutData('COURSE', course.objectId);
      leave.set('student', studentObj);
      leave.set('teacher', teacherObj);
      leave.set('date', date);
      leave.set('reason', that.data.reason);
      leave.set('read', false);
      leave.set('adopted', false);
      leave.set('course', courseObj);
      leave.save()
        .then(function (res) {
          debug && console.log(res)
          wx.hideToast();
          that.setData({
            leaveNoteSend: true
          });
          //COURSE表leaves字段追加记录
          var courseClass = AV.Object.createWithoutData('COURSE', course.objectId);
          var leaveClass = AV.Object.createWithoutData('LEAVE', res.id);
          courseClass.addUnique('leaves', leaveClass);
          courseClass.save().then(function () {
            //_USER表leaves字段追加记录
            var userReg = AV.Object.createWithoutData('_User', app.globalData.user.objectId);
            var leaveReg = AV.Object.createWithoutData('LEAVE', res.id);
            userReg.addUnique('leaves', leaveReg);
            userReg.save().then(function () {
              wx.hideToast();
              //做标记防止重复请假
              app.globalData.leaveTag.push({
                courseId: that.data.courseId,
                success: true
              });
            });
          });
        })
        .catch(console.error);
    }
  },
  //绑定输入内容
  inputReason: function (e) {
    this.setData({
      reason: e.detail.value
    })
  },
  createMessage: function () {
    this.setData({
      leaveNoteShow: true
    });
  },
  //查看图片
  previewPic: function (e) {
    wx.previewImage({
      urls: [e.target.dataset.src] // 需要预览的图片http链接列表
    });
  },
  deny: function (e) {
    var that = this;
    var leave = AV.Object.createWithoutData('LEAVE', e.target.dataset.leaveId);
    leave.set('read', true);
    leave.set('agree', false);
    leave.save().then(function (lv) {
      that.initLeaveNotes(that.data.courseId);
      debug && console.log('tag success')
    });
  },
  pass: function (e) {
    var that = this;
    var leave = AV.Object.createWithoutData('LEAVE', e.target.dataset.leaveId);
    leave.set('read', true);
    leave.set('agree', true);
    leave.save().then(function (lv) {
      that.initLeaveNotes(that.data.courseId);
      debug && console.log('tag success')
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
