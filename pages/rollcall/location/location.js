const AV = require('../../../lib/leancloud-storage');
var ROLLCALL = AV.Object.extend('ROLLCALL');
var app = getApp();
Page({
    data: {
        template: 'signIn',
        location: {
            hasLocation: false,
            longitude: 104.066541,
            latitude: 30.572269
        },
        formatedLocation: {
        },
        radius: 500,
        timeout: 5,
        timeLeft: '0:0',
        bgc: '#09BB07',
        manuAdd: false,
        signedInStudents: [],
        onLeaveStudents: [],
        signedInStudentsNum: 0,
        studentSum: 0,
        accuracy: '未获取'
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
                console.log(res)
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
        console.log(point)
        rollcall.set('teacherLoc', point);
        rollcall.set('radius', this.data.radius);
        rollcall.set('type', 'location');
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
                that.startCountdown(that.data.timeout - 1, 59);
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
                            var onLeaveStudents = [];
                            for (var i = 0; i < lvs.length; i++) {
                                var lv = AV.Object.createWithoutData('LEAVE', lvs[i].id);
                                lv.set('adopted', true);
                                lv.save().then();
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
        var that = this;
        var rollcall = new ROLLCALL();
        var student = AV.Object.createWithoutData('_User', app.globalData.user.objectId);
        var point = new AV.GeoPoint(this.data.location.latitude, this.data.location.longitude);
        var stuObj = {
            student: student,
            loc: point
        }
        rollcall.addUnique('students', stuObj);
        rollcall.set('studentLoc', point);
        rollcall.set('radius', this.data.radius);
        rollcall.set('type', 'location');
        rollcall.set('timeout', this.data.timeout);
        rollcall.save()
            .then(function (rc) {
                console.log(rc)
                that.setData({
                    template: 'countdown'
                });
                that.startCountdown(that.data.timeout);
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
    onLoad: function (options) {
        // 生命周期函数--监听页面加载
        console.log(options)
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