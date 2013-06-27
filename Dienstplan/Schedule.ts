/// <reference path="Scripts/typings/knockout/knockout.d.ts" />
// Module
module Schedule {

	// Class
	export class Employee {

		constructor(public name: string, public index:number, public color : string) {
		}
	}

	export class WorkUnit {

		public work: KnockoutObservableArray<KnockoutObservable<WorkCell>> = ko.observableArray<KnockoutObservable<WorkCell>>([]);

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

		change(index: number) {
			//this.work()[index]();
		}
	}

	export class WorkDay {
		public WorkUnits:  KnockoutObservableArray<WorkUnit> = ko.observableArray<WorkUnit>([]);
		constructor() {
		}

		get dayName() {
			return this.WorkUnits()[0].dayName;
		}
	}

	export class WorkCell {

		constructor(ntype: WorkType) {
			this.type = ko.observable(ntype);
			this.text = ko.computed(function (): string { return this.stringRep(); }, this);
			this.css = ko.computed(function (): string { return "css" + this.text(); }, this);
		}

		public type: KnockoutObservable<WorkType>;
		public text: KnockoutComputed<string>;
		public css: KnockoutComputed<string>;

		stringRep(): string {
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
		}

		changeType() {
			var newType = this.type();
			switch (newType) {
				case WorkType.Pause:
					newType = WorkType.KinderDienst; break;
				case WorkType.KinderDienst:
					newType = WorkType.Reinigung; break;
				case WorkType.Reinigung:
					newType = WorkType.Rasten; break;
				case WorkType.Rasten:
					newType = WorkType.Aufbleiber; break;
				case WorkType.Aufbleiber:
					newType = WorkType.MittagsDienst; break;
				case WorkType.MittagsDienst:
					newType = WorkType.Pause; break;
			}
			
			this.type(newType);
		}
	}

	export enum WorkType {
		Pause,
		KinderDienst,
		Reinigung,
		Rasten,
		Aufbleiber,
		MittagsDienst,
	}

	export class Week {
		Days: KnockoutObservableArray<WorkDay> = ko.observableArray<WorkDay>([]);
		Employees: KnockoutObservableArray<Employee> = ko.observableArray<Employee>([]);

		constructor() {
			
			this.Employees.push(new Employee("Elisabeth", 0, "red"));
			this.Employees.push(new Employee("Theresa", 1, "green"));
			this.Employees.push(new Employee("Irene", 2, "yellow"));
			this.Employees.push(new Employee("Renate", 3, "palegreen"));
			this.Employees.push(new Employee("Andrea", 4, "orange"));

			for (var day = 0; day < 5; day++)
			{
				this.Days.push(new WorkDay());

				for (var i = 0; i < 9; i++)
				{
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

		totalHours(employee: Employee): string{
			var hours = 0;
			for (var day = 0; day < this.Days().length; day++)
			{
				for (var i = 0; i < this.Days()[day].WorkUnits().length; i++)
				{
					var wu = this.Days()[day].WorkUnits()[i];
					var wc = wu.work()[employee.index]();
					if (wc.type() != WorkType.Pause)
					{
						hours += (wu.endTime.getTime() - wu.beginTime.getTime());
					}
				}
			}

			var d = new Date(hours);
			return (d.getHours() - 1)+ ":" + d.getMinutes();
		}
	}
}
