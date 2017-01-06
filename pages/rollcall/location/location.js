Page({
    data: {
        markers: [{
            iconPath: "/images/HandUp.png",
            id: 0,
            latitude: 23.099994,
            longitude: 113.324520,
            width: 50,
            height: 50
        }],
        polyline: [{
            points: [{
                longitude: 113.3245211,
                latitude: 23.10229
            }, {
                longitude: 113.324520,
                latitude: 23.21229
            }],
            color: "#FF0000DD",
            width: 2,
            dottedLine: true
        }],
        controls: [{
            id: 1,
            iconPath: '/images/HandUp.png',
            position: {
                left: 0,
                top: 300 - 50,
                width: 50,
                height: 50
            },
            clickable: true
        }]
    },
    regionchange(e) {
        console.log(e.type)
    },
    markertap(e) {
        console.log(e.markerId)
    },
    controltap(e) {
        console.log(e.controlId)
    },
    getLocation: function () {
        wx.getLocation({
            type: 'gcj02',
            success: function (res) {
                console.log(res)
                var latitude = res.latitude
                var longitude = res.longitude
                var accuracy = res.accuracy
                wx.openLocation({
                    latitude: latitude,
                    longitude: longitude,
                    scale: 28
                })
            }
        })
    },
    onLoad: function (options) {
        // 生命周期函数--监听页面加载
    },
    onReady: function () {
        // 生命周期函数--监听页面初次渲染完成
    },
    onShow: function () {
        // 生命周期函数--监听页面显示
    },
    onHide: function () {
        // 生命周期函数--监听页面隐藏
    },
    onUnload: function () {
        // 生命周期函数--监听页面卸载
    },
    onPullDownRefresh: function () {
        // 页面相关事件处理函数--监听用户下拉动作
    },
    onReachBottom: function () {
        // 页面上拉触底事件的处理函数
    },
    onShareAppMessage: function () {
        // 用户点击右上角分享
        return {
            title: 'title', // 分享标题
            desc: 'desc', // 分享描述
            path: 'path' // 分享路径
        }
    }
})