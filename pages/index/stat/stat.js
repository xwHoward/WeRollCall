// pages/index/stat/stat.js
const AV = require('../../../lib/leancloud-storage');
var Promise = require("../../../lib/es6-promise.min");
var app = getApp();
var LEAVE = AV.Object.extend('LEAVE');
var teacher = {};
var course = {};
var date = (new Date()).toLocaleDateString();
Page({
  data: {
    attend: 7,
    leave: 1,//假数据
    absence: 2,
    total: 10,
    teacher: '',
    student: '',
    stuId: '',
    courseName: '',
    date: date,
    tempFilePath: null,
    reason: "",
    leaveNoteShow: false,
    leaveNoteSend: false,
    template: 'teacher'
  },
  onLoad: function (options) {
    if (app.globalData.user.userType == '学生') {
      this.setData({
        template: 'student'
      });
      this.getCourseInfo(options.courseId);
    } else {
      this.setData({
        template: 'teacher'
      });
      console.log("teacher")
      this.initLeaveNotes(options.courseId);
    }
  },
  // 加载请假条列表
  initLeaveNotes: function (courseId) {
    var that = this;
    var courseQuery = new AV.Query('COURSE');
    courseQuery.include('leaves');
    courseQuery.get(courseId).then(function (crs) {
      console.log("course:", crs)
      course = crs;
      // var courseName = crs.get('courseName');
      // console.log("teacher:", teacher)
      var leaves = crs.get('leaves');
      var unreadLeaves = [];
      for (let i = 0; i < leaves.length; i++) {
        if (leaves[i].get('read') == false) {
          //未读请假条
          var stu = leaves[i].get('student');
          var leaveQuery = new AV.Query('LEAVE');
          leaveQuery.include('student');
          leaveQuery.get(leaves[i].id).then(function (lv) {
            console.log("leave:", lv)
            //遍历unreadLeave获取student字段，重新拼装unreadLeaves
            var student = lv.get('student');
            console.log(student)
            var unreadLeave = {
              reason: lv.get('reason'),
              studentName: student.get('userName'),
              studentId: student.get('userId'),
              date: lv.get('date'),
              imgSrc: lv.get('image').get('url')
            }
            unreadLeaves.push(unreadLeave);
            if (i == leaves.length - 1) {
              console.log("unreadLeaves:", unreadLeaves)
              that.setData({
                unreadLeaves: unreadLeaves
              });
            }
          });
        }
      }
    }, function (error) {
      // 异常处理
      console.log(error);
    });
  },
  //初始化点名总数及课程信息
  getCourseInfo: function (courseId) {
    var that = this;
    var myRollcalls = app.globalData.user.rollcalls;
    var courseQuery = new AV.Query('COURSE');
    // courseQuery.include('rollcalls');
    courseQuery.include('teacher');
    courseQuery.get(courseId).then(function (crs) {
      console.log("course:", crs)
      course = crs;
      var courseName = crs.get('courseName');
      var rollcalls = crs.get('rollcalls');
      teacher = crs.get('teacher');
      var targetStr = '';
      for (var i = 0; i < rollcalls.length; i++) {
        targetStr += rollcalls[i].id;
      }
      console.log("teacher:", teacher)
      var attend = 0;
      console.log("myRollcalls:", myRollcalls)
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
        teacher: teacher.get('userName'),
        student: app.globalData.user.userName,
        attend: attend,
        absence: rollcalls.length - attend - leave,
        stuId: app.globalData.user.userId
      });
      // var userQuery = new AV.Query('_User');

    }, function (error) {
      // 异常处理
      console.log(error);
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
        console.log("tempFilePath:", tempFilePath);
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
        console.log("file:", file.id);
        resolve(file.id);

      }).catch(function (error) {
        reject(error);
      });
    });
  },
  //向老师发送假条
  sendMessage: function () {
    var that = this;
    wx.showToast({
      title: '发送中...',
      icon: 'loading',
      mask: true
    })
    //带图片文件
    if (that.data.tempFilePath !== null) {
      console.log("带图片文件")
      that.uploadFile()
        .then(function (fileId) {
          console.log(fileId);
          var leave = new LEAVE();
          var studentObj = AV.Object.createWithoutData('_User', app.globalData.user.objectId);
          var teacherObj = AV.Object.createWithoutData('_User', teacher.id);
          var courseObj = AV.Object.createWithoutData('COURSE', course.id);
          var fileObj = AV.Object.createWithoutData('_File', fileId);
          leave.set('student', studentObj);
          leave.set('teacher', teacherObj);
          leave.set('date', date);
          leave.set('reason', that.data.reason);
          leave.set('course', courseObj);
          leave.set('image', fileObj);
          leave.set('read', false);
          leave.save()
            .then(function (res) {
              console.log(res)
              wx.hideToast();
              that.setData({
                leaveNoteSend: true
              });
              //COURSE表leaves字段追加记录
              var courseClass = AV.Object.createWithoutData('COURSE', course.id);
              var leaveClass = AV.Object.createWithoutData('LEAVE', res.id);
              courseClass.addUnique('leaves', leaveClass);
              courseClass.save();
            })
            .catch(console.error);
        });
    } else {
      //没有图片信息
      console.log("没有图片信息")
      var leave = new LEAVE();
      var studentObj = AV.Object.createWithoutData('_User', app.globalData.user.objectId);
      var teacherObj = AV.Object.createWithoutData('_User', teacher.id);
      var courseObj = AV.Object.createWithoutData('COURSE', course.id);
      console.log(studentObj, teacherObj, courseObj)
      leave.set('student', studentObj);
      leave.set('teacher', teacherObj);
      leave.set('date', date);
      leave.set('reason', that.data.reason);
      leave.set('course', courseObj);
      leave.save()
        .then(function (res) {
          console.log(res)
          wx.hideToast();
          that.setData({
            leaveNoteSend: true
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
    console.log(e);
    wx.previewImage({
      urls: [e.target.dataset.src] // 需要预览的图片http链接列表
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