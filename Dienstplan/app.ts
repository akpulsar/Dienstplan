
/// <reference path="Schedule.ts" />
/// <reference path="Scripts/typings/knockout/knockout.d.ts" />


var schedule: Schedule.Week = new Schedule.Week();

window.onload = () => {
	ko.applyBindings(schedule);
};