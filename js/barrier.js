//
// A dynamic barrier that executes a callback when all outstanding tasks
// have finished.
//
// @author Godmar Back
//
var Barrier = function (callback) {
    var count = 0;
    var reached = false;

    // add a task
    this.add = function () {
        if (reached)
            throw new Error("attempting to expand already reached barrier");

        count++;

        return {
            finish: function () {
                count--;
                if (count == 0) {
                    reached = true;
                    callback();
                }
            }
        }
    }

    this.addFunc = function () {
        if (reached)
            throw new Error("attempting to expand already reached barrier");

        count++;

        return function () {
            count--;
            if (count == 0) {
                reached = true;
                callback();
            }
        }
    }
};

