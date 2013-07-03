/// <reference path="Scripts/typings/knockout/knockout.d.ts" />
// Module
var Schedule;
(function (Schedule) {
    // Class
    var Employee = (function () {
        function Employee(name, index, color, type) {
            this.name = name;
            this.index = index;
            this.color = color;
            this.type = type;
        }
        return Employee;
    })();
    Schedule.Employee = Employee;

    (function (EmployeeType) {
        EmployeeType[EmployeeType["Teacher"] = 0] = "Teacher";

        EmployeeType[EmployeeType["Helper"] = 1] = "Helper";
    })(Schedule.EmployeeType || (Schedule.EmployeeType = {}));
    var EmployeeType = Schedule.EmployeeType;

    (function (WorkUnitType) {
        WorkUnitType[WorkUnitType["EinzelGruppeFrueh"] = 0] = "EinzelGruppeFrueh";
        WorkUnitType[WorkUnitType["DoppelGruppe"] = 1] = "DoppelGruppe";
        WorkUnitType[WorkUnitType["Mittagessen"] = 2] = "Mittagessen";
        WorkUnitType[WorkUnitType["KuecheRastenAufbleiber"] = 3] = "KuecheRastenAufbleiber";
        WorkUnitType[WorkUnitType["EinzelGruppe"] = 4] = "EinzelGruppe";

        WorkUnitType[WorkUnitType["EinzelGruppeReinigung"] = 5] = "EinzelGruppeReinigung";
    })(Schedule.WorkUnitType || (Schedule.WorkUnitType = {}));
    var WorkUnitType = Schedule.WorkUnitType;

    var WorkUnit = (function () {
        function WorkUnit(beginTime, endTime, type) {
            this.beginTime = beginTime;
            this.endTime = endTime;
            this.type = type;
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

        Object.defineProperty(WorkUnit.prototype, "errors", {
            get: function () {
                var err = [];

                switch (this.type) {
                    case WorkUnitType.EinzelGruppeFrueh:
                        if (!this.work().some(function (x) {
                            return x().employee.type == EmployeeType.Teacher && x().type() == WorkType.KinderDienst;
                        })) {
                            err.push("There must be at least one teacher");
                        }
                        break;
                    case WorkUnitType.DoppelGruppe:
                        if (this.work().filter(function (x) {
                            return (x().employee.type == EmployeeType.Teacher && x().type() == WorkType.KinderDienst);
                        }).length != 2 || this.work().filter(function (x) {
                            return (x().employee.type == EmployeeType.Helper && x().type() == WorkType.KinderDienst);
                        }).length != 2) {
                            err.push("There must be 2 teachers and 2 helpers");
                        }
                        break;
                    case WorkUnitType.Mittagessen:
                        if (!(this.work().filter(function (x) {
                            return x().type() != WorkType.Pause;
                        }).length >= 3)) {
                            err.push("There must be 3 employees at duty");
                        }
                        break;
                    case WorkUnitType.KuecheRastenAufbleiber:
                        if (!(this.work().filter(function (x) {
                            return x().employee.type == EmployeeType.Helper && x().type() == WorkType.Kueche;
                        }).length == 1 && this.work().filter(function (x) {
                            return x().type() == WorkType.Rasten;
                        }).length == 1 && this.work().filter(function (x) {
                            return x().type() == WorkType.Aufbleiber;
                        }).length == 1)) {
                            err.push("1x Küche, 1x Rasten, 1x Aufbleiber");
                        }
                        break;
                    case WorkUnitType.EinzelGruppe:
                        if (!(this.work().filter(function (x) {
                            return x().employee.type == EmployeeType.Teacher && x().type() == WorkType.KinderDienst;
                        }).length == 1 && this.work().filter(function (x) {
                            return x().employee.type == EmployeeType.Teacher && x().type() == WorkType.KinderDienst;
                        }).length == 1)) {
                            err.push("1x Päd + 1x Hilf -> Kinderdienst");
                        }
                        break;
                    case WorkUnitType.EinzelGruppeReinigung:
                        if (!(this.work().filter(function (x) {
                            return x().employee.type == EmployeeType.Teacher && x().type() == WorkType.KinderDienst;
                        }).length == 1 && this.work().filter(function (x) {
                            return x().type() == WorkType.Reinigung;
                        }).length == 1)) {
                            err.push("1x Päd -> Kinderdienst + 1x Hilf -> Reinigung");
                        }
                        break;
                }

                return err.length > 0 ? err.join("<br>") : "none";
            },
            enumerable: true,
            configurable: true
        });
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
        function WorkCell(ntype, employee, workUnit) {
            this.employee = employee;
            this.workUnit = workUnit;
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
                case WorkType.Kueche:
                    return "Küche";
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
                    newType = WorkType.Kueche;
                    break;
                case WorkType.Kueche:
                    newType = WorkType.Rasten;
                    break;
                case WorkType.Rasten:
                    newType = WorkType.Aufbleiber;
                    break;
                case WorkType.Aufbleiber:
                    newType = WorkType.Reinigung;
                    break;
                case WorkType.Reinigung:
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
        WorkType[WorkType["Kueche"] = 2] = "Kueche";
        WorkType[WorkType["Rasten"] = 3] = "Rasten";
        WorkType[WorkType["Aufbleiber"] = 4] = "Aufbleiber";
        WorkType[WorkType["Reinigung"] = 5] = "Reinigung";
    })(Schedule.WorkType || (Schedule.WorkType = {}));
    var WorkType = Schedule.WorkType;

    var Week = (function () {
        function Week() {
            var _this = this;
            this.Days = ko.observableArray([]);
            this.Employees = ko.observableArray([]);
            this.Employees.push(new Employee("Elisabeth", 0, "red", EmployeeType.Teacher));
            this.Employees.push(new Employee("Theresa", 1, "green", EmployeeType.Teacher));
            this.Employees.push(new Employee("Irene", 2, "yellow", EmployeeType.Helper));
            this.Employees.push(new Employee("Renate", 3, "palegreen", EmployeeType.Helper));
            this.Employees.push(new Employee("Andrea", 4, "orange", EmployeeType.Teacher));

            for (var day = 0; day < 5; day++) {
                var d = new WorkDay();
                this.Days.push(d);

                var y = 2013;
                var m = 06;

                var units = [
                    new WorkUnit(new Date(y, m, 22 + day, 07, 00), new Date(y, m, 22 + day, 07, 30), WorkUnitType.EinzelGruppeFrueh),
                    new WorkUnit(new Date(y, m, 22 + day, 07, 30), new Date(y, m, 22 + day, 08, 00), WorkUnitType.DoppelGruppe),
                    new WorkUnit(new Date(y, m, 22 + day, 08, 00), new Date(y, m, 22 + day, 08, 30), WorkUnitType.DoppelGruppe),
                    new WorkUnit(new Date(y, m, 22 + day, 08, 30), new Date(y, m, 22 + day, 09, 00), WorkUnitType.DoppelGruppe),
                    new WorkUnit(new Date(y, m, 22 + day, 09, 00), new Date(y, m, 22 + day, 09, 30), WorkUnitType.DoppelGruppe),
                    new WorkUnit(new Date(y, m, 22 + day, 09, 30), new Date(y, m, 22 + day, 10, 00), WorkUnitType.DoppelGruppe),
                    new WorkUnit(new Date(y, m, 22 + day, 10, 00), new Date(y, m, 22 + day, 10, 30), WorkUnitType.DoppelGruppe),
                    new WorkUnit(new Date(y, m, 22 + day, 10, 30), new Date(y, m, 22 + day, 11, 00), WorkUnitType.DoppelGruppe),
                    new WorkUnit(new Date(y, m, 22 + day, 11, 00), new Date(y, m, 22 + day, 11, 30), WorkUnitType.DoppelGruppe),
                    new WorkUnit(new Date(y, m, 22 + day, 11, 30), new Date(y, m, 22 + day, 12, 00), WorkUnitType.Mittagessen),
                    new WorkUnit(new Date(y, m, 22 + day, 12, 00), new Date(y, m, 22 + day, 12, 30), WorkUnitType.Mittagessen),
                    new WorkUnit(new Date(y, m, 22 + day, 12, 30), new Date(y, m, 22 + day, 13, 00), WorkUnitType.KuecheRastenAufbleiber),
                    new WorkUnit(new Date(y, m, 22 + day, 13, 00), new Date(y, m, 22 + day, 13, 30), WorkUnitType.KuecheRastenAufbleiber),
                    new WorkUnit(new Date(y, m, 22 + day, 13, 30), new Date(y, m, 22 + day, 14, 00), WorkUnitType.EinzelGruppe),
                    new WorkUnit(new Date(y, m, 22 + day, 14, 00), new Date(y, m, 22 + day, 14, 30), WorkUnitType.EinzelGruppe),
                    new WorkUnit(new Date(y, m, 22 + day, 14, 30), new Date(y, m, 22 + day, 15, 00), WorkUnitType.EinzelGruppe),
                    new WorkUnit(new Date(y, m, 22 + day, 15, 00), new Date(y, m, 22 + day, 15, 30), WorkUnitType.EinzelGruppe),
                    new WorkUnit(new Date(y, m, 22 + day, 15, 30), new Date(y, m, 22 + day, 16, 00), WorkUnitType.EinzelGruppeReinigung)
                ];

                units.forEach(function (x) {
                    return d.WorkUnits.push(x);
                });

                d.WorkUnits().forEach(function (wu) {
                    _this.Employees().forEach(function (e) {
                        wu.work().push(ko.observable(new WorkCell(WorkType.Pause, e, wu)));
                    });
                });
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
