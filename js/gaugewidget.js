/* Gage widget */
function GageWidget(domid, title) {
    var g = new JustGage({
        id: domid,
        value: 0, 
        min: 0,
        max: 400,
        title: title,
        titleFontColor: "maroon",
        valueFontColor: "maroon",
    }); 

    this.computeSpeed = function (oldts, newts, n) {
        var diffms = moment(newts).diff(moment(oldts));
        var perhour = Math.round(n/diffms*1000*60*60);
        g.refresh(perhour);
    }

    this.recordtimestamps = [];
}

GageWidget.prototype.update = function (record) {
    var d = new Date(record.timestamp);
    this.recordtimestamps.push(d);
    var len = this.recordtimestamps.length;
    if (len > 1)
        this.computeSpeed(this.recordtimestamps[0], this.recordtimestamps[len-1], len);

    if (len > 10)
        this.recordtimestamps.shift();
}
