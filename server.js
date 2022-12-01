const mysql = require('mysql2');
const inquirer = require('inquirer');
require('console.table');

const connection = mysql.createConnection({
	host: 'localhost',
	port: 3306,
	user: 'root',

	// Your password
	password: 'Peepopog69$',
	database: 'employeesDB',
});

connection.connect(function (err) {
	if (err) throw err;
	console.log('connected as id ' + connection.threadId);
	console.log('Welcome to Employee Manager!');
	firstPrompt();
});

// function which prompts the user for what action they should take
function firstPrompt() {
	inquirer
		.prompt({
			type: 'list',
			name: 'task',
			message: 'Would you like to do?',
			choices: [
				'view all departments',
				'view all roles',
				'view all employees',
				'add a role',
				'add an employee',
			],
		})
		.then(function ({ task }) {
			switch (task) {
				case 'view all employees':
					viewEmployee();
					break;

				case 'View all departments':
					viewEmployeeByDepartment();
					break;

				case 'add a employee':
					addEmployee();
					break;

				case 'add a role':
					addRole();
					break;

				case 'End':
					connection.end();
					break;
			}
		});
}

//View Employees/ READ all, SELECT * FROM
function viewEmployee() {
	console.log('Viewing employees\n');

	var query = `SELECT e.id, e.first_name, e.last_name, r.title, d.name AS department, r.salary, CONCAT(m.first_name, ' ', m.last_name) AS manager
  FROM employee e
  LEFT JOIN role r
	ON e.role_id = r.id
  LEFT JOIN department d
  ON d.id = r.department_id
  LEFT JOIN employee m
	ON m.id = e.manager_id`;

	connection.query(query, function (err, res) {
		if (err) throw err;

		console.table(res);
		console.log('Employees viewed!\n');

		firstPrompt();
	});
}

//"View Employees by Department" / READ by, SELECT * FROM
// Make a department array
function viewEmployeeByDepartment() {
	console.log('Viewing employees by department\n');

	var query = `SELECT d.id, d.name, r.salary AS budget
  FROM employee e
  LEFT JOIN role r
	ON e.role_id = r.id
  LEFT JOIN department d
  ON d.id = r.department_id
  GROUP BY d.id, d.name`;

	connection.query(query, function (err, res) {
		if (err) throw err;

		const departmentChoices = res.map((data) => ({
			value: data.id,
			name: data.name,
		}));

		console.table(res);
		console.log('Department view succeed!\n');

		promptDepartment(departmentChoices);
	});
}

// User choose the department list, then employees pop up
function promptDepartment(departmentChoices) {
	inquirer
		.prompt([
			{
				type: 'list',
				name: 'departmentId',
				message: 'Which department would you choose?',
				choices: departmentChoices,
			},
		])
		.then(function (answer) {
			console.log('answer ', answer.departmentId);

			var query = `SELECT e.id, e.first_name, e.last_name, r.title, d.name AS department 
  FROM employee e
  JOIN role r
	ON e.role_id = r.id
  JOIN department d
  ON d.id = r.department_id
  WHERE d.id = ?`;

			connection.query(query, answer.departmentId, function (err, res) {
				if (err) throw err;

				console.table('response ', res);
				console.log(res.affectedRows + 'Employees are viewed!\n');

				firstPrompt();
			});
		});
}

function addEmployee() {
	console.log('Adding an employee!');

	var query = `SELECT r.id, r.title, r.salary 
      FROM role r`;

	connection.query(query, function (err, res) {
		if (err) throw err;

		const roleChoices = res.map(({ id, title, salary }) => ({
			value: id,
			title: `${title}`,
			salary: `${salary}`,
		}));

		console.table(res);
		console.log('RoleToAttach!');

		promptInsert(roleChoices);
	});
}

function promptInsert(roleChoices) {
	inquirer
		.prompt([
			{
				type: 'input',
				name: 'first_name',
				message: "What is the employee's first name?",
			},
			{
				type: 'input',
				name: 'last_name',
				message: "What is the employee's last name?",
			},
			{
				type: 'list',
				name: 'roleId',
				message: "What is the employee's role?",
				choices: roleChoices,
			},
		])
		.then(function (answer) {
			console.log(answer);

			var query = `INSERT INTO employee SET ?`;
			connection.query(
				query,
				{
					first_name: answer.first_name,
					last_name: answer.last_name,
					role_id: answer.roleId,
					manager_id: answer.managerId,
				},
				function (err, res) {
					if (err) throw err;

					console.table(res);
					console.log(res.insertedRows + 'Inserted successfully!\n');

					firstPrompt();
				}
			);
		});
}

//"Add Role" / CREATE: INSERT INTO
function addRole() {
	var query = `SELECT d.id, d.name, r.salary AS budget
    FROM employee e
    JOIN role r
    ON e.role_id = r.id
    JOIN department d
    ON d.id = r.department_id
    GROUP BY d.id, d.name`;

	connection.query(query, function (err, res) {
		if (err) throw err;

		// (callbackfn: (value: T, index: number, array: readonly T[]) => U, thisArg?: any)
		const departmentChoices = res.map(({ id, name }) => ({
			value: id,
			name: `${id} ${name}`,
		}));

		console.table(res);
		console.log('Department array!');

		promptAddRole(departmentChoices);
	});
}

function promptAddRole(departmentChoices) {
	inquirer
		.prompt([
			{
				type: 'input',
				name: 'roleTitle',
				message: 'Role title?',
			},
			{
				type: 'input',
				name: 'roleSalary',
				message: 'Role Salary',
			},
			{
				type: 'list',
				name: 'departmentId',
				message: 'Department?',
				choices: departmentChoices,
			},
		])
		.then(function (answer) {
			var query = `INSERT INTO role SET ?`;

			connection.query(
				query,
				{
					title: answer.title,
					salary: answer.salary,
					department_id: answer.departmentId,
				},
				function (err, res) {
					if (err) throw err;

					console.table(res);
					console.log('Role Inserted!');

					firstPrompt();
				}
			);
		});
}
