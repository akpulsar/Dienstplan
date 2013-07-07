/// <reference path="Scripts/typings/knockout/knockout.d.ts" />
/// <reference path="Scripts/typings/jquery.cookie/jquery.cookie.d.ts" />

// Module
module Schedule {

	// Class
	export class Employee {

		constructor(public name: string, public index:number, public color : string, public type : EmployeeType) {
		}
	}
	 
	export enum EmployeeType {
		Teacher,
		Helper
	}
	
	export enum WorkUnitType {
		EinzelGruppeFrueh,
		DoppelGruppe,
		Mittagessen,
		KuecheRastenAufbleiber,
		EinzelGruppe,
		EinzelGruppeReinigung
	}

	export class WorkUnit {

		public work: KnockoutObservableArray<KnockoutObservable<WorkCell>> = ko.observableArray<KnockoutObservable<WorkCell>>([]);

		constructor(public beginTime: Date, public endTime: Date, public type : WorkUnitType) {
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
				WorkUnit.pad(this.beginTime.getMinutes(), 2);
			//this.endTime.getHours() + ":" +
			//WorkUnit.pad(this.endTime.getMinutes(), 2);
		}

		get errors(): string {
			var err: string[] = [];

			switch(this.type)
			{
				case WorkUnitType.EinzelGruppeFrueh:
					// check that there is at least one teacher
					if (!this.work().some(x => x().employee.type == EmployeeType.Teacher && x().type() == WorkType.KinderDienst))
					{
						err.push("There must be at least one teacher");
					}
					break;
				case WorkUnitType.DoppelGruppe:
					if (this.beginTime.getHours() < 8)
					{
						// check that there are 2 teachers and 1 helper  with KinderDienst
						if (this.work().filter(x => (x().employee.type == EmployeeType.Teacher && x().type() == WorkType.KinderDienst)).length < 2 ||
							this.work().filter(x => (x().employee.type == EmployeeType.Helper && x().type() == WorkType.KinderDienst)).length < 1)
						{
							err.push("There must be 2 teachers and 2 helpers");
						}
					} else {
						// check that there are 2 teachers and 2 helpers with KinderDienst
						if (this.work().filter(x => (x().employee.type == EmployeeType.Teacher && x().type() == WorkType.KinderDienst)).length < 2 ||
							this.work().filter(x => (x().employee.type == EmployeeType.Helper && x().type() == WorkType.KinderDienst)).length < 2)
						{
							err.push("There must be 2 teachers and 2 helpers");
						}
					}
					break;
				case WorkUnitType.Mittagessen:
					if (!(this.work().filter(x => x().type() != WorkType.Pause).length >= 3))
					{
						err.push("There must be 3 employees at duty");
					}
					break;
				case WorkUnitType.KuecheRastenAufbleiber:
					if (!(this.work().filter(x => x().employee.type == EmployeeType.Helper && x().type() == WorkType.Kueche).length == 1 &&
						this.work().filter(x => x().type() == WorkType.Rasten).length == 1 &&
						this.work().filter(x => x().type() == WorkType.Aufbleiber).length == 1))
					{
						err.push("1x Küche, 1x Rasten, 1x Aufbleiber");
					}
					break;
				case WorkUnitType.EinzelGruppe:
					if (!(this.work().filter(x => x().employee.type == EmployeeType.Teacher && x().type() == WorkType.KinderDienst).length == 1 &&
						this.work().filter(x => x().employee.type == EmployeeType.Teacher && x().type() == WorkType.KinderDienst).length == 1))
					{
						err.push("1x Päd + 1x Hilf -> Kinderdienst");
					}
					break;
				case WorkUnitType.EinzelGruppeReinigung:
					if (!(this.work().filter(x => x().employee.type == EmployeeType.Teacher && x().type() == WorkType.KinderDienst).length >= 1 && 
						this.work().filter(x => x().type() == WorkType.Reinigung).length >= 1))
					{
						err.push("1x Päd -> Kinderdienst + 1x Hilf -> Reinigung");
					}
					break;
			}

			return err.length > 0 ? err.join("<br>") : "none";
		}
	}

	export class WorkDay {
		public WorkUnits: KnockoutObservableArray<WorkUnit> = ko.observableArray<WorkUnit>([]);

		constructor() {
		}

		get dayName() {
			return this.WorkUnits()[0].dayName;
		}

		errorsForEmployee(employee: Employee): { invalid: boolean; messages: string[] } {
			var ret = { invalid: false, messages: [] };
			var sixHours = this.checkSixHoursLimit(employee);

			if (!sixHours.result) {
				ret.invalid = true;
				ret.messages.push(sixHours.message);
			}

			return ret;
		}

		checkSixHoursLimit(employee: Employee): { result: boolean; message: string } {
			var tooLong = false;
			var beginTime = this.WorkUnits()[0].beginTime;
			var endTime = beginTime;

			this.WorkUnits().forEach((wu) => {
				if (wu.work()[employee.index]().type() == WorkType.Pause)
				{
					beginTime = wu.endTime;
					endTime = wu.endTime;
				}
				else
				{
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
			
			return { result : true, message : "ok." };
		}
	}

	export class WorkCell {

		constructor(ntype: WorkType, public employee : Employee, public workUnit : WorkUnit) {
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
				case WorkType.Kueche:
					return "Küche";
				case WorkType.Rasten:
					return "Rasten";
				case WorkType.Reinigung:
					return "Reinigung";
			}

			return "other";
		}

		changeType() {
			var newType = this.type();
			var unitType = this.workUnit.type;

			switch (unitType) {
				case WorkUnitType.DoppelGruppe:
				case WorkUnitType.EinzelGruppe:
				case WorkUnitType.EinzelGruppeFrueh:
					switch (newType) {
						case WorkType.Pause:
							newType = WorkType.KinderDienst; break;
						case WorkType.KinderDienst:
							newType = WorkType.Pause; break;
						default:
							newType = WorkType.KinderDienst; break;
					}
					break;
				case WorkUnitType.EinzelGruppeReinigung:
					switch (newType) {
						case WorkType.Pause:
							newType = WorkType.KinderDienst; break;
						case WorkType.KinderDienst:
							newType = WorkType.Reinigung; break;
						case WorkType.Reinigung:
							newType = WorkType.Pause; break;
						default:
							newType = WorkType.KinderDienst; break;
					}
					break;
				case WorkUnitType.KuecheRastenAufbleiber:
					switch (newType) {
						case WorkType.Pause:
							newType = WorkType.Kueche; break;
						case WorkType.Kueche:
							newType = WorkType.Rasten; break;
						case WorkType.Rasten:
							newType = WorkType.Aufbleiber; break;
						case WorkType.Aufbleiber:
							newType = WorkType.Pause; break;
						default:
							newType = WorkType.Pause;
					}
					break;
				case WorkUnitType.Mittagessen:
					switch (newType) {
						case WorkType.Pause:
							newType = WorkType.KinderDienst; break;
						case WorkType.KinderDienst:
							newType = WorkType.Pause; break;
						default:
							newType = WorkType.Pause;
					}
					break;
			}
			
			this.type(newType);
		}
	}

	export enum WorkType {
		Pause,
		KinderDienst,
		Kueche,
		Rasten,
		Aufbleiber,
		Reinigung,
	}

	export class Week {
		Days: KnockoutObservableArray<WorkDay> = ko.observableArray<WorkDay>([]);
		Employees: KnockoutObservableArray<Employee> = ko.observableArray<Employee>([]);
		PlanName: KnockoutObservable<string> = ko.observable<string>("default");

		constructor() {
			
			this.Employees.push(new Employee("Elisabeth", 0, "red", EmployeeType.Teacher));
			this.Employees.push(new Employee("Theresa", 1, "green", EmployeeType.Teacher));
			this.Employees.push(new Employee("Irene", 2, "yellow", EmployeeType.Helper));
			this.Employees.push(new Employee("Renate", 3, "palegreen", EmployeeType.Helper));
			this.Employees.push(new Employee("Andrea", 4, "orange", EmployeeType.Helper));

			for (var day = 0; day < 5; day++)
			{
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
					new WorkUnit(new Date(y, m, 22 + day, 15, 30), new Date(y, m, 22 + day, 16, 00), WorkUnitType.EinzelGruppeReinigung),
				];

				units.forEach(x => d.WorkUnits.push(x));

				d.WorkUnits().forEach(wu => {
					this.Employees().forEach(e => {
						wu.work().push(ko.observable(new WorkCell(WorkType.Pause, e, wu)));
					});
				});
			}
		}

		totalHours(employee: Employee): number {
			var hours = 0;
			for (var day = 0; day < this.Days().length; day++)
			{
				for (var i = 0; i < this.Days()[day].WorkUnits().length; i++)
				{
					var wu = this.Days()[day].WorkUnits()[i];
					var wc = wu.work()[employee.index]();
					if (wc.type() != WorkType.Pause)
					{
						hours += (wu.endTime.getTime() - wu.beginTime.getTime()) / (1000 * 60 * 60);
					}
				}
			}
			return hours;
		}

		relativeHours(employee: Employee): string{
			return ((this.totalHours(employee) / 38.5) * 100) + '%';
		}

		serializePlan(): string {
			var result = [];

			this.Days().forEach(d => { 
				d.WorkUnits().forEach(wu => {
					wu.work().forEach(w => {
						result.push(w().type());
					});
				});
			});

			return JSON.stringify(result);
		}

		loadPlan(x: string) {
			var arr = JSON.parse(x);
			var pos = 0;
			this.Days().forEach(d => {
				d.WorkUnits().forEach(wu => {
					wu.work().forEach(w => {
						w().type(arr[pos++]);
					});
				});
			});
		}

		Save() {
			$.cookie(this.PlanName(), encodeURIComponent(this.serializePlan()), { expires: 365 });
		}

		Load() {
			this.loadPlan(decodeURIComponent($.cookie(this.PlanName())));
		}
	}
}
