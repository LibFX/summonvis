/**
 * A queue with a variable delay.  
 *
 * @author Godmar Back godmar@gmail.com, May 2013
 * @param delays [3000, 2000, 1500, 1000, 500]
 *        or function returning delay based on queue length
 *
 *      if queue length is 0, delay is 3000ms
 *      if queue length is 1, delay is 2000ms
 *      if queue length is 2, delay is 1500ms etc.
 */
function VariableDelayQueue(delayDesc) {
    this.itemQueue = [];
    this.running = false;
    this.delayDesc = delayDesc;
}

/**
 * Add 'item' to queue.
 * When item reaches the head of the queue, its 'start'
 * method is called:
 *
 *      item.start(delay, callback)
 *
 * Item must call 'callback' after 'delay' has passed.
 */
VariableDelayQueue.prototype.add = function (item) {
    var self = this;
    function pollQueue() {
        if (self.itemQueue.length == 0)
            return;

        var item = self.itemQueue.shift();
        self.running = true;

        var delay;
        if (typeof (self.delayDesc) == "function") {
            delay = self.delayDesc(self.itemQueue.length);
        } else {
            for (var i = 0; i < self.delayDesc.length; i++)
                if (self.itemQueue.length >= i)
                    delay = self.delayDesc[i];
                else
                    break;
        }

        item.start(delay, function() {
            self.running = false;
            pollQueue();
        });
    }

    this.itemQueue.push(item);
    if (!this.running)
        pollQueue();
}
