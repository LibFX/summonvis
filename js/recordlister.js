/*
 * @author Godmar Back
 */
function RecordLister(n, $container, myQueue) {
    this.$container = $container;
    this.maxN = n;
    this.myQueue = myQueue || new VariableDelayQueue([3000, 2000, 1500, 1000, 500]);
}

RecordLister.prototype.update = function (record) {
    var self = this;
    var newrecord = formatRecord(record);
    var $contentdiv = $('<div class="libfx-record-inner"></div>').html(newrecord);
    var $newitem = $('<li class="libfx-record"></li>')
            .append("<div class='libfx-record-pusher'></div>").append($contentdiv);

    this.myQueue.add({
        start:  function (delay, next) {
            self.$container.prepend($newitem);
            $newitem.children('.libfx-record-pusher').transition(
               {'margin-top': '0%' }, String(delay), 'ease', 
                function() {
                    if (self.$container.children('li').length > self.maxN) {
                        self.$container.children('li:last-child').remove();
                    }
                    next();
                });
        }
    });
}

