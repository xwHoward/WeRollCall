const AV = require('../../../lib/leancloud-storage');
var ROLLCALL = AV.Object.extend('ROLLCALL');
var app = getApp();
Page({
    data: {
        template: '',
        location: {
            hasLocation: false,
            longitude: 104.066541,
            latitude: 30.572269
        },
        formatedLocation: {
        },
        radius: 100,
        timeout: 5
    },
    getLocation: function () {
        var that = this;
        wx.showToast({
            title: '获取位置信息',
            icon: 'loading',
            mask: true,
            duration: 1000
        });
        wx.getLocation({
            type: 'gcj02',
            success: function (res) {
                console.log(res)
                that.setData({
                    'location.longitude': res.longitude,
                    'location.latitude': res.latitude,
                    'location.hasLocation': true,
                    formatedLocation: that.formatLocation(res.longitude, res.latitude)
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
        console.log(app.globalData.user)
        var teacher = AV.Object.createWithoutData('_User', app.globalData.user.objectId);
        rollcall.set('teacher', teacher);
        var point = new AV.GeoPoint(this.data.location.latitude, this.data.location.longitude);
        console.log(point)
        rollcall.set('teacherLoc', point);
        rollcall.set('radius', this.data.radius);
        rollcall.set('type', 'location');
        rollcall.set('students', []);
        rollcall.set('timeout', this.data.timeout);
        rollcall.save()
        .then(function(rc){
            console.log(rc)
            var token = rc.id.toString().substring(20);
            that.setData({
                template: 'token',
                token: token
            });
            that.startCountdown(that.data.timeout);
        })
        .catch(console.error);
    },
    //更新学生签到情况
    updateStatus: function(){

    },
    //学生签到
    signIn: function(){
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
        .then(function(rc){
            console.log(rc)
            var token = rc.id.toString().substring(20);
            that.setData({
                template: 'token',
                token: token
            });
            that.startCountdown(that.data.timeout);
        })
        .catch(console.error);
    },
    startCountdown: function (m) {
        var that = this;
        m--;
        let s = 9;
        var intv = setInterval(function () {
            if (s >= 0) {
                that.setData({
                    timeLeft: m + ':' + s--
                });
            } else {
                m--;
                s = 9;
                if (m < 0) {
                    clearInterval(intv);
                } else {
                    that.setData({
                        timeLeft: m + ':' + s--
                    });
                }
            }
        }, 1000);
    },
    onLoad: function (options) {
        // 生命周期函数--监听页面加载
        // this.getLocation();
        if(app.globalData.user.userType == '老师'){
            this.setData({
                template: 'create'
            });
        }else{
            this.setData({
                template: 'repo'
            });
        }
    },
    onShow: function () {
        // 生命周期函数--监听页面显示
    }
})