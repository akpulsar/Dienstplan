/// <reference path="Schedule.ts" />
/// <reference path="Scripts/typings/knockout/knockout.d.ts" />
var schedule = new Schedule.Week();

window.onload = function () {
    ko.applyBindings(schedule);
};
//@ sourceMappingURL=app.js.map
