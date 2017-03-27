const AV = require('../../../lib/leancloud-storage');
var Promise = require("../../../lib/es6-promise.min");
var ROLLCALL = AV.Object.extend('ROLLCALL');
var app = getApp();
var debug = app.globalData.debug;
Page({
    data: {
        markers: [],
        circles: [],
        animation: {},
        template: 'signIn',
        location: {
            hasLocation: false,
            longitude: 104.066541,
            latitude: 30.572269
        },
        formatedLocation: {
        },
        radius: 1000,
        timeout: 5,
        timeLeft: '0:0',
        bgc: '#09BB07',
        manuAdd: false,
        signedInStudents: [],
        onLeaveStudents: [],
        signedInStudentsNum: 0,
        studentSum: 0,
        accuracy: '未获取',
        countdownEnd: false
    },
    getLocation: function () {
        var that = this;
        wx.showToast({
            title: '获取位置信息',
            icon: 'loading',
            mask: true
        });
        wx.getLocation({
            type: 'gcj02',
            success: function (res) {
                debug && console.log(res)
                that.setData({
                    'location.longitude': res.longitude,
                    'location.latitude': res.latitude,
                    'location.hasLocation': true,
                    formatedLocation: that.formatLocation(res.longitude, res.latitude),
                    accuracy: res.accuracy
                });
                wx.hideToast();
            }
        })
    },
    formatLocation: function (longitude, latitude) {
        longitude = longitude.toFixed(2)
        latitude = latitude.toFixed(2)
        return {
            longitude: longitude.toString().split('.'),
            latitude: latitude.toString().split('.')
        }
    },
    radiusChange: function (e) {
        this.setData({
            radius: e.detail.value
        });
    },
    timeoutChange: function (e) {
        this.setData({
            timeout: e.detail.value
        });
    },
    createRollcall: function () {
        var that = this;
        var rollcall = new ROLLCALL();
        var teacher = AV.Object.createWithoutData('_User', app.globalData.user.objectId);
        rollcall.set('teacher', teacher);
        var course = AV.Object.createWithoutData('COURSE', that.data.courseId);
        rollcall.set('course', course);
        var point = new AV.GeoPoint(this.data.location.latitude, this.data.location.longitude);
        debug && console.log(point)
        rollcall.set('whereCreated', point);
        rollcall.set('radius', this.data.radius);
        rollcall.set('done', false);
        rollcall.set('type', 'location');
        rollcall.set('students', []);
        var stuA = AV.Object.createWithoutData('_User', '587b6dd15c497d0058a39e76');//测试数据
        rollcall.addUnique('students', stuA);//测试数据
        rollcall.set('timeout', this.data.timeout);
        rollcall.save()
            .then(function (rc) {
                debug && console.log('新增rollcall行成功，rollcall行注入course成功');
                var course = AV.Object.createWithoutData('COURSE', that.data.courseId);
                var rollcall = AV.Object.createWithoutData('ROLLCALL', rc.id);
                course.addUnique('rollcalls', rollcall);
                course.save().then(function (c) {
                    debug && console.log('course行注入rollcall成功');
                });
                var teacher = AV.Object.createWithoutData('_User', app.globalData.user.objectId);
                teacher.addUnique('rollcalls', rollcall);
                teacher.save().then(function (t) {
                    debug && console.log('user行注入rollcall成功');
                });
                var animation = wx.createAnimation({
                    transformOrigin: "50% 50%",
                    duration: 2000,
                    timingFunction: "ease",
                    delay: 0
                });
                animation.top(0).step();
                that.setData({
                    template: 'countdown',
                    rollcallId: rc.id,
                    animation: animation.export()
                });
                that.startCountdown(that.data.timeout - 1, 59).then(function () {
                    //倒计时结束
                });
                var intv = setInterval(function () {
                    if (!that.data.countdownEnd) {
                        that.updateStatus();
                    } else {
                        clearInterval(intv);
                    }
                }, 5000);
            }).catch(console.error);
        that.getLeaveStudents();
    },

    getLeaveStudents: function () {
        var that = this;
        //对本次点名的请假记录做清理
        //向今日有效请假记录插入标记字段
        var today = (new Date()).toLocaleDateString();
        //对符合日期的请假做标记adopted字段
        var leaveQuery = new AV.Query('LEAVE');
        leaveQuery.equalTo('date', today);
        leaveQuery.include('student');
        leaveQuery.find()
            .then(function (lvs) {
                debug && console.log('今日请假记录：', lvs)
                var onLeaveStudents = [];
                var onLeaveStudentsPrms = lvs.map(function (el) {
                    return new Promise(function (resolve, reject) {
                        var lv = AV.Object.createWithoutData('LEAVE', el.id);
                        lv.set('adopted', true);
                        lv.save().then(function () {
                            onLeaveStudents.push(el.get('student'));
                            resolve();
                        });
                    });
                });
                Promise.all(onLeaveStudentsPrms).then(function () {
                    debug && console.log("onLeaveStudents:", onLeaveStudents)
                    that.setData({
                        onLeaveStudents: onLeaveStudents
                    });
                });
            })
            .catch(console.error);
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
            var sum = c.toJSON().students.length;
            that.setData({
                studentSum: sum
            });
        });
    },

    //学生签到
    signIn: function () {
        if (this.data.location.hasLocation) {
            var that = this;
            var rollcallQuery = new AV.Query('ROLLCALL');
            var radiuskilom = this.data.radius / 1000;
            var studentLoc = new AV.GeoPoint(this.data.location.latitude, this.data.location.longitude);
            rollcallQuery.withinKilometers('whereCreated', studentLoc, radiuskilom);
            rollcallQuery.find().then(function (rcs) {
                debug && console.log("rollcalls finded:", rcs)
                if (rcs.length < 1) {
                    debug && console.log('签到失败！')
                    app.globalData.signInTag.push({
                        rollcallId: that.data.rollcallId,
                        success: false
                    });
                    wx.showModal({
                        title: '签到失败！',
                        content: '你的位置距离老师过远，请重新报告地理位置',
                        showCancel: false,
                        confirmText: '重试',
                        confirmColor: '#3CC51F',
                        success: function (res) {

                        }
                    });
                } else {
                    for (var i = 0; i < rcs.length; i++) {
                        if (rcs[i].id == that.data.rollcallId) {
                            //签到成功
                            var rollcall = AV.Object.createWithoutData('ROLLCALL', that.data.rollcallId);
                            var student = AV.Object.createWithoutData('_User', app.globalData.user.objectId);
                            rollcall.addUnique('students', student);
                            rollcall.save().then(function (rc) {
                                debug && console.log('rollcall表注入签到学生成功')
                                var rollcall = AV.Object.createWithoutData('ROLLCALL', rc.id);
                                var self = AV.Object.createWithoutData('_User', app.globalData.user.objectId);
                                self.addUnique('rollcalls', rollcall);
                                self.save().then(function (stu) {
                                    debug && console.log('user表注入rollcall成功')
                                });
                                wx.showModal({
                                    title: '签到成功',
                                    content: '点击确定返回主页',
                                    showCancel: false,
                                    confirmText: '返回主页',
                                    confirmColor: '#3CC51F',
                                    success: function (res) {
                                        debug && console.log('返回主页')
                                        app.globalData.signInTag.push({
                                            rollcallId: that.data.rollcallId,
                                            success: true
                                        });
                                        wx.navigateBack();
                                    }
                                });
                            })
                            break;
                        }
                    }
                    app.globalData.signInTag.push({
                        rollcallId: that.data.rollcallId,
                        success: false
                    });
                    wx.showModal({
                        title: '签到失败！',
                        content: '你的位置距离老师过远，请重新报告地理位置',
                        showCancel: false,
                        confirmText: '重试',
                        confirmColor: '#3CC51F',
                        success: function (res) {

                        }
                    });
                }
            });
        }
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
                            countdownEnd: true
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
            var sum = c.get('students').length;
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
        debug && console.log(this.data.stuId)
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
                debug && console.log(error)
            });
    },
    //初始化学生签到界面
    initSignInData: function (rcId) {
        var that = this;
        var rollcallQuery = new AV.Query('ROLLCALL');
        rollcallQuery.get(rcId).then(function (rc) {
            debug && console.log('rollcall:', rc)
            var radius = rc.get('radius');
            var timeStart = rc.get('createdAt');
            var timeout = rc.get('timeout');
            var teacherLoc = rc.get('whereCreated');
            debug && console.log("teacherLoc:",teacherLoc)
            var now = new Date();
            var timeLeft = timeStart - now + timeout * 60000;
            if (timeLeft <= 0) {
                //点名已结束
                that.setData({
                    bgc: '#f76060',
                    countdownEnd: true
                });
                wx.showToast({
                    title: '点名已结束',
                    icon: 'success',
                    duration: 3000
                });
            } else {
                //点名正在进行中
                that.setData({
                    radius: radius,
                    markers: [{
                        iconPath: "/images/Marker.png",
                        id: 0,
                        latitude: teacherLoc.latitude,
                        longitude: teacherLoc.longitude,
                        width: 50,
                        height: 50
                    }],
                    circles: [{
                        latitude: teacherLoc.latitude,
                        longitude: teacherLoc.longitude,
                        radius: radius,
                        fillColor: '#1AAD16aa',
                        strokeWidth: 3
                    }]
                });
                var min = (new Date(timeLeft)).getMinutes();
                var sec = (new Date(timeLeft)).getSeconds();
                that.startCountdown(min, sec);
            }
        });
    },
    onLoad: function (options) {
        // 生命周期函数--监听页面加载
        debug && console.log(options)
        if (options.userType == 'student') {
            //学生身份，对应签到界面
            this.setData({
                template: 'signIn',
                rollcallId: options.rollcallId
            });
            this.initSignInData(options.rollcallId);
        } else {
            //教师身份，对应创建点名
            this.setData({
                template: 'create',
                courseId: options.courseId
            });
        }
    },
    onShow: function () {
        // 生命周期函数--监听页面显示
    }
})