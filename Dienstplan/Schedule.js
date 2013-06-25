var Schedule;
(function (Schedule) {
    var Employee = (function () {
        function Employee(name) {
            this.name = name;
        }
        return Employee;
    })();
    Schedule.Employee = Employee;

    var WorkUnit = (function () {
        function WorkUnit(beginTime, endTime) {
            this.beginTime = beginTime;
            this.endTime = endTime;
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
                return this.beginTime.getHours() + ":" + WorkUnit.pad(this.beginTime.getMinutes(), 2) + " - " + this.endTime.getHours() + ":" + WorkUnit.pad(this.endTime.getMinutes(), 2);
            },
            enumerable: true,
            configurable: true
        });
        return WorkUnit;
    })();
    Schedule.WorkUnit = WorkUnit;

    var WorkDay = (function () {
        function WorkDay() {
            this.WorkUnits = [];
        }
        Object.defineProperty(WorkDay.prototype, "dayName", {
            get: function () {
                return this.WorkUnits[0].dayName;
            },
            enumerable: true,
            configurable: true
        });
        return WorkDay;
    })();
    Schedule.WorkDay = WorkDay;

    var Week = (function () {
        function Week() {
            this.Days = [];
            this.Employees = [];
            for (var day = 0; day < 5; day++) {
                this.Days.push(new WorkDay());

                for (var i = 0; i < 8; i++) {
                    var firstHalf = new WorkUnit(new Date(2013, 06, 23 + day, 07 + i, 00), new Date(2013, 06, 23 + day, 07 + i, 30));
                    var secondHalf = new WorkUnit(new Date(2013, 06, 23 + day, 07 + i, 30), new Date(2013, 06, 23 + day, 07 + i + 1, 00));
                    this.Days[day].WorkUnits.push(firstHalf);
                    this.Days[day].WorkUnits.push(secondHalf);
                }
            }

            this.Employees.push(new Employee("Elisabeth"));
            this.Employees.push(new Employee("Pad1"));
            this.Employees.push(new Employee("Irene"));
            this.Employees.push(new Employee("Renate"));
        }
        return Week;
    })();
    Schedule.Week = Week;
})(Schedule || (Schedule = {}));
