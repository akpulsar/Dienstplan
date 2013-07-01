/// <reference path="Scripts/typings/knockout/knockout.d.ts" />
// Module
var Schedule;
(function (Schedule) {
    // Class
    var Employee = (function () {
        function Employee(name, index, color) {
            this.name = name;
            this.index = index;
            this.color = color;
        }
        return Employee;
    })();
    Schedule.Employee = Employee;

    var WorkUnit = (function () {
        function WorkUnit(beginTime, endTime) {
            this.beginTime = beginTime;
            this.endTime = endTime;
            this.work = ko.observableArray([]);
        }
        WorkUnit.pad = function (num, size) {
            var s = num + "";
            while (s.length < size)
                s = "0" + s;
            return s;
        };

        Object.defineProperty(WorkUnit.prototype, "dayName", {
            get: function () {
                var weekday = new Array(7);
                weekday[0] = "Sunday";
                weekday[1] = "Monday";
                weekday[2] = "Tuesday";
                weekday[3] = "Wednesday";
                weekday[4] = "Thursday";
                weekday[5] = "Friday";
                weekday[6] = "Saturday";

                return weekday[this.beginTime.getDay()];
            },
            enumerable: true,
            configurable: true
        });

        Object.defineProperty(WorkUnit.prototype, "shortName", {
            get: function () {
                return this.beginTime.getHours() + ":" + WorkUnit.pad(this.beginTime.getMinutes(), 2);
            },
            enumerable: true,
            configurable: true
        });

        WorkUnit.prototype.change = function (index) {
        };
        return WorkUnit;
    })();
    Schedule.WorkUnit = WorkUnit;

    var WorkDay = (function () {
        function WorkDay() {
            this.WorkUnits = ko.observableArray([]);
        }
        Object.defineProperty(WorkDay.prototype, "dayName", {
            get: function () {
                return this.WorkUnits()[0].dayName;
            },
            enumerable: true,
            configurable: true
        });

        WorkDay.prototype.errorsForEmployee = function (employee) {
            var ret = { invalid: false, messages: [] };
            var sixHours = this.checkSixHoursLimit(employee);

            if (!sixHours.result) {
                ret.invalid = true;
                ret.messages.push(sixHours.message);
            }

            return ret;
        };

        WorkDay.prototype.checkSixHoursLimit = function (employee) {
            console.log("checking six hours");
            var tooLong = false;
            var beginTime = this.WorkUnits()[0].beginTime;
            var endTime = beginTime;

            this.WorkUnits().forEach(function (wu) {
                if (wu.work()[employee.index]().type() == WorkType.Pause) {
                    beginTime = wu.beginTime;
                    endTime = wu.endTime;
                } else {
                    endTime = wu.endTime;
                    var diff = (endTime.valueOf() - beginTime.valueOf());
                    if (diff > (1000 * 60 * 60 * 6)) {
                        console.log("too long");
                        tooLong = true;
                    }
                }
            });

            if (tooLong) {
                return { result: false, message: "work unit longer than six hours" };
            }

            return { result: true, message: "ok." };
        };
        return WorkDay;
    })();
    Schedule.WorkDay = WorkDay;

    var WorkCell = (function () {
        function WorkCell(ntype) {
            this.type = ko.observable(ntype);
            this.text = ko.computed(function () {
                return this.stringRep();
            }, this);
            this.css = ko.computed(function () {
                return "css" + this.text();
            }, this);
        }
        WorkCell.prototype.stringRep = function () {
            switch (this.type()) {
                case WorkType.Pause:
                    return "Pause";
                case WorkType.KinderDienst:
                    return "Kinder";
                case WorkType.Aufbleiber:
                    return "Aufbleiber";
                case WorkType.MittagsDienst:
                    return "Mittag";
                case WorkType.Rasten:
                    return "Rasten";
                case WorkType.Reinigung:
                    return "Reinigung";
            }

            return "other";
        };

        WorkCell.prototype.changeType = function () {
            var newType = this.type();
            switch (newType) {
                case WorkType.Pause:
                    newType = WorkType.KinderDienst;
                    break;
                case WorkType.KinderDienst:
                    newType = WorkType.Reinigung;
                    break;
                case WorkType.Reinigung:
                    newType = WorkType.Rasten;
                    break;
                case WorkType.Rasten:
                    newType = WorkType.Aufbleiber;
                    break;
                case WorkType.Aufbleiber:
                    newType = WorkType.MittagsDienst;
                    break;
                case WorkType.MittagsDienst:
                    newType = WorkType.Pause;
                    break;
            }

            this.type(newType);
        };
        return WorkCell;
    })();
    Schedule.WorkCell = WorkCell;

    (function (WorkType) {
        WorkType[WorkType["Pause"] = 0] = "Pause";
        WorkType[WorkType["KinderDienst"] = 1] = "KinderDienst";
        WorkType[WorkType["Reinigung"] = 2] = "Reinigung";
        WorkType[WorkType["Rasten"] = 3] = "Rasten";
        WorkType[WorkType["Aufbleiber"] = 4] = "Aufbleiber";
        WorkType[WorkType["MittagsDienst"] = 5] = "MittagsDienst";
    })(Schedule.WorkType || (Schedule.WorkType = {}));
    var WorkType = Schedule.WorkType;

    var Week = (function () {
        function Week() {
            this.Days = ko.observableArray([]);
            this.Employees = ko.observableArray([]);
            this.Employees.push(new Employee("Elisabeth", 0, "red"));
            this.Employees.push(new Employee("Theresa", 1, "green"));
            this.Employees.push(new Employee("Irene", 2, "yellow"));
            this.Employees.push(new Employee("Renate", 3, "palegreen"));
            this.Employees.push(new Employee("Andrea", 4, "orange"));

            for (var day = 0; day < 5; day++) {
                this.Days.push(new WorkDay());

                for (var i = 0; i < 9; i++) {
                    var firstHalf = new WorkUnit(new Date(2013, 06, 22 + day, 07 + i, 00), new Date(2013, 06, 22 + day, 07 + i, 30));
                    var secondHalf = new WorkUnit(new Date(2013, 06, 22 + day, 07 + i, 30), new Date(2013, 06, 22 + day, 07 + i + 1, 00));
                    this.Days()[day].WorkUnits.push(firstHalf);
                    this.Days()[day].WorkUnits.push(secondHalf);

                    for (var e = 0; e < this.Employees().length; e++) {
                        firstHalf.work().push(ko.observable(new WorkCell(WorkType.Pause)));
                        secondHalf.work().push(ko.observable(new WorkCell(WorkType.Pause)));
                    }
                }
            }
        }
        Week.prototype.totalHours = function (employee) {
            var hours = 0;
            for (var day = 0; day < this.Days().length; day++) {
                for (var i = 0; i < this.Days()[day].WorkUnits().length; i++) {
                    var wu = this.Days()[day].WorkUnits()[i];
                    var wc = wu.work()[employee.index]();
                    if (wc.type() != WorkType.Pause) {
                        hours += (wu.endTime.getTime() - wu.beginTime.getTime());
                    }
                }
            }

            var d = new Date(hours);
            return d;
        };

        Week.prototype.relativeHours = function (employee) {
            return ((this.totalHours(employee).getHours() / 38.5) * 100) + '%';
        };
        return Week;
    })();
    Schedule.Week = Week;
})(Schedule || (Schedule = {}));
//@ sourceMappingURL=Schedule.js.map
