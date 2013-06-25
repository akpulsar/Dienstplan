// Module
module Schedule {

	// Class
	export class Employee {

		constructor(public name: string) {
		}
	}

	export class WorkUnit {

		constructor(public beginTime: Date, public endTime: Date) {
		}

		static pad(num, size) {
			var s = num + "";
			while (s.length < size) s = "0" + s;
			return s;
		}	

		get dayName() : string {
			var weekday = new Array(7);
			weekday[0] = "Sunday";
			weekday[1] = "Monday";
			weekday[2] = "Tuesday";
			weekday[3] = "Wednesday";
			weekday[4] = "Thursday";
			weekday[5] = "Friday";
			weekday[6] = "Saturday";

			return weekday[this.beginTime.getDay()];
		}

		get shortName() {
			return this.beginTime.getHours() + ":" +
				WorkUnit.pad(this.beginTime.getMinutes(), 2) + " - " +
				this.endTime.getHours() + ":" +
				WorkUnit.pad(this.endTime.getMinutes(), 2);
		}
	}

	export class WorkDay {
		WorkUnits: WorkUnit[] = [];
		constructor() {
		}

		get dayName() {
			return this.WorkUnits[0].dayName;
		}
	}

	export class Week {
		Days: WorkDay[] = [];
		Employees: Employee[] = [];

		constructor() {
			for (var day = 0; day < 5; day++)
			{
				this.Days.push(new WorkDay());

				for (var i = 0; i < 8; i++)
				{
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
	}
}
