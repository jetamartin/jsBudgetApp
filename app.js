// Note: that the budgetController & uiControllers are designed to be independent.
// This is done so that for example you can expand the capabilities of the
// budgetController without affecting the UI.
//*********************************************************************
//
// BUDGET CONTROLLER 
//
//*********************************************************************

var budgetController = (function () {

	var Expense = function (id, description, value) {
		this.id = id;
		this.description = description;
		this.value = value;
		this.percentage = -1;
	};

	Expense.prototype.calcPercentage = function (totalIncome) {
		if (totalIncome > 0) {
			this.percentage = Math.round((this.value / totalIncome) * 100);
		} else {
			this.percentage = -1;
		}
	};

	Expense.prototype.getPercentange = function () {
		return this.percentage;
	};

	var Income = function (id, description, value) {
		this.id = id;
		this.description = description;
		this.value = value;
	};

	var calculateTotal = function (type) {
		var sum = 0;
		data.allItems[type].forEach(function (currentElement) {
			sum += currentElement.value;
		});
		data.totals[type] = sum;
	};

	var data = {
		allItems: {
			exp: [],
			inc: []
		},
		totals: {
			exp: 0,
			inc: 0
		},
		budget: 0,
		percentage: -1,
	};

	return {

		addItem: function (type, des, val) {
			var newItem, ID;
			// Create new ID
			if (data.allItems[type].length > 0) {
				ID = data.allItems[type][data.allItems[type].length - 1].id + 1;
			} else {
				ID = 0;
			}

			// Create new item based on 'inc' or 'exp' type
			if (type === 'exp') {
				newItem = new Expense(ID, des, val);
			} else {
				newItem = new Income(ID, des, val);
			}
			// Push new item into data structure
			data.allItems[type].push(newItem);

			// Return the new element
			return newItem;
		},
		deleteItem: function (type, id) {
			var ids, index;
			// Use map to return an array (ids) wih all of the IDs of expense/income array
			// doing so will allow us to identify the index of expense/income element we want to delete
			// Map produces a new array
			ids = data.allItems[type].map(function (current) {
				return current.id;
			});

			// Get the index of element we want to remove
			index = ids.indexOf(id);

			// Delete only if the id found in the ids array 
			if (index !== -1) {
				data.allItems[type].splice(index, 1);
			}

		},
		calculateBudget: function () {
			// Calculate total income and expenses
			calculateTotal('exp');
			calculateTotal('inc');

			// Calculate the budget (income - expenses)
			data.budget = data.totals.inc - data.totals.exp;
			if (data.totals.inc > 0) {
				// Calculate the percentage of income spent
				data.percentage = Math.round((data.totals.exp / data.totals.inc) * 100);
			} else {
				data.percentage = -1;
			}
		},
		calculatePercentages: function () {
			// Calculate percentage for each expense
			data.allItems.exp.forEach(function (current) {
				current.calcPercentage(data.totals.inc);
			});
		},
		getPercentages: function () {
			// Need to return array containing all expenses so we need to use map method to 
			var allPercentages = data.allItems.exp.map(function (current) {
				return current.percentage;
			});
			return allPercentages;
		},
		getBudget: function () {
			return {
				budget: data.budget,
				totalInc: data.totals.inc,
				totalExp: data.totals.exp,
				percentage: data.percentage
			};
		},

		testing: function () {
			console.log(data);
		}
	};
})();


//*********************************************************************
//
// UI CONTROLLER
//
//*********************************************************************

var uiController = (function () {
	var DOMstrings = {
		inputType: '.add__type',
		inputDescription: '.add__description',
		inputValue: '.add__value',
		inputBtn: '.add__btn',
		incomeContainer: '.income__list',
		expenseContainer: '.expenses__list',
		budgetLabel: '.budget__value',
		incomeLabel: '.budget__income--value',
		expenseLabel: '.budget__expenses--value',
		percentageLabel: '.budget__expenses--percentage',
		container: '.container',
		expensesPercentLabel: '.item__percentage',
		dateLabel: '.budget__title--month'
	};

	var formatNumber = function (num, type) {
		var numSplit, int, dec;
		/*
		- or + before the number
		eactly 2 decimal points
		comma separating the thoustnads
		*/
		// Remove the sign (+/-) of number
		num = Math.abs(num);
		// Convert to string and leave 2 decimal places
		num = num.toFixed(2);

		// Split the number into 2 parts..integer and decimal part
		numSplit = num.split('.');

		// Store int part in variable int
		int = numSplit[0];

		// Insert comma in appropriate locationn in integer part of number e.g., 23510
		if (int.length > 3) {
			int = int.substr(0, int.length - 3) + ',' + int.substr(int.length - 3);
		}

		dec = numSplit[1];

		// Alt way to create final formated number using 2 steps vs 1 as below.
		//		type === 'exp' ? sign = '-' : sign = '+';
		//		return sign + ' ' + int + '.' + dec;

		// Return formatted number in one statement (alt to 2 statements above)
		return (type === 'exp' ? '-' : '+') + ' ' + int + '.' + dec;

	};

	// General purpose function to loop through a list of items
	var nodelistForEach = function (list, callback) {
		for (var i = 0; i < list.length; i++) {
			callback(list[i], i);
		}
	};

	return {
		getInput: function () {
			return {
				type: document.querySelector(DOMstrings.inputType).value, // Will be either inc or exp
				description: document.querySelector(DOMstrings.inputDescription).value,
				value: parseFloat(document.querySelector(DOMstrings.inputValue).value)
			};
		},
		getDOMstrings: function () {
			return DOMstrings;
		},
		addListItem: function (obj, type) {
			var html, newHtml, element;
			// Create HTML string with placeholder text
			if (type === 'inc') {
				element = DOMstrings.incomeContainer;
				html = '<div class="item clearfix" id="inc-%id%"><div class="item__description">%description%</div><div class="right clearfix"><div class="item__value">%value%</div><div class="item__delete"><button class="item__delete--btn"><i class="ion-ios-close-outline"></i></button></div></div></div>';
			} else if (type === 'exp') {
				element = DOMstrings.expenseContainer;
				html = '<div class="item clearfix" id="exp-%id%"><div class="item__description">%description%</div><div class="right clearfix"><div class="item__value">%value%</div><div class="item__percentage">21%</div><div class="item__delete"><button class="item__delete--btn"><i class="ion-ios-close-outline"></i></button></div></div></div>';
			}

			// Replace the placeholder text with some actual data
			newHtml = html.replace('%id%', obj.id);
			newHtml = newHtml.replace('%value%', formatNumber(obj.value, type));
			newHtml = newHtml.replace('%description%', obj.description);

			// Insert the HTML into the DOM
			document.querySelector(element).insertAdjacentHTML('beforeend', newHtml);
		},
		deleteListItem: function (selectorID) {
			var element = document.getElementById(selectorID);
			element.parentNode.removeChild(element);
		},

		clearFields: function () {
			var fields, fieldsArr;
			// querySelectorAll returns a list and not an array.
			fields = document.querySelectorAll(DOMstrings.inputDescription + ', ' + DOMstrings.inputValue);
			// Trick used to convert the list into an array so we can use Array methods
			fieldsArr = Array.prototype.slice.call(fields);

			fieldsArr.forEach(function (curElement) {
				curElement.value = "";
			});

			// Set focus to first fields (descriptio field)
			fieldsArr[0].focus();
		},
		displayBudget: function (obj) {
			var type;

			obj.budget >= 0 ? type = 'inc' : type = 'exp';

			// Set income total			
			document.querySelector(DOMstrings.incomeLabel).textContent = formatNumber(obj.totalInc, 'inc');

			// Set expenses total
			document.querySelector(DOMstrings.expenseLabel).textContent = formatNumber(obj.totalExp, 'exp');

			// Set budget total
			document.querySelector(DOMstrings.budgetLabel).textContent = formatNumber(obj.budget, type);

			if (obj.percentage > 0) {
				// Set expenses percentage
				document.querySelector(DOMstrings.percentageLabel).textContent = obj.percentage + '%';
			} else {
				document.querySelector(DOMstrings.percentageLabel).textContent = '---';
			}
		},
		// Percentages and array with all calculated percentages
		displayPercentages: function (percentages) {
			// Fields contains list of all the nodes (locations) where percentages will need to be displayed
			var fields = document.querySelectorAll(DOMstrings.expensesPercentLabel);



			nodelistForEach(fields, function (currentElement, index) {
				// Logic below is the callback function logic
				if (percentages[index] > 0) {
					currentElement.textContent = percentages[index] + '%';
				} else {
					currentElement.textContent = '---';
				}
			});
		},
		displayDate: function () {
			var now, year, month, months;
			now = new Date();
			months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
			month = now.getMonth();
			year = now.getFullYear();
			document.querySelector(DOMstrings.dateLabel).textContent = months[month] + ' ' + year;
		},
		changedType: function () {
			var fields = document.querySelectorAll(
				DOMstrings.inputType + ',' +
				DOMstrings.inputDescription + ',' +
				DOMstrings.inputValue);

			nodelistForEach(fields, function (currentItem) {
				currentItem.classList.toggle('red-focus');
			});
			document.querySelector(DOMstrings.inputBtn).classList.toggle('red');
		}
	};

})();

// AppController connects the budget and ui controllers together;
// It wasn't necessary to pass other controllers in as params but doing so
// creates more independence and separation of control. Also note that 
// budget and ui controller param names are slightly diff than names of these controllers

//*********************************************************************
//
// GENERAL APP CONTROLLER
//
//*********************************************************************

var appController = (function (budgetCtrl, UICtrl) {

	var setupEventListeners = function () {

		var DOM = UICtrl.getDOMstrings();

		// User presses the button to enter data 
		document.querySelector(DOM.inputBtn).addEventListener('click', ctrlAddItem);

		// User hits the enter key to enter data
		document.addEventListener('keypress', function (event) {
			// Note some browser don't support keycode method so we also add in .which method
			if (event.keyCode === 13 || event.which === 13) {
				ctrlAddItem();
			}
		});
		// Create a event listener on the DOM parent node that contains both Inccome and Expense items
		document.querySelector(DOM.container).addEventListener('click', ctrlDeleteItem);

		document.querySelector(DOM.inputType).addEventListener('change', UICtrl.changedType);

	};

	var ctrlAddItem = function () {
		var input, newItem;

		// 1. Get the input field data
		input = UICtrl.getInput();

		if (input.description !== "" && !isEmpty(input.description) && !isNaN(input.value) && input.value > 0) {
			// 2. Add the item to the budget controller
			newItem = budgetCtrl.addItem(input.type, input.description, input.value);

			// 3. Add the item to the UI
			UICtrl.addListItem(newItem, input.type);

			// 4. Clear the fields
			UICtrl.clearFields();

			// 5. Calculate and update budget
			updateBudget();

			// 6. Calculate and update percentages
			updatePercentages();
		}

	};

	var ctrlDeleteItem = function (event) {
		var itemID, splitID, type, ID;

		// Note this is not a very flexible solution if the HTML changes then you will likely break this code.
		// at the bottom of the file (commented out) I've attached two more general and robust solutions.

		itemID = event.target.parentNode.parentNode.parentNode.parentNode.id;
		if (itemID) {
			// 
			splitID = itemID.split('-');
			type = splitID[0];
			ID = parseInt(splitID[1]);

			// 1. Delete the item from the data structure
			budgetCtrl.deleteItem(type, ID);

			// 2. Delete the item from the UI
			UICtrl.deleteListItem(itemID);

			// 3. Update and show the new budget
			updateBudget();

			// 4. Calculate and update percentages
			updatePercentages();

		}
	};
	var updateBudget = function () {
		// 1. Calculate the budget
		budgetCtrl.calculateBudget();
		// 2. Return the budget
		var budget = budgetCtrl.getBudget();

		// 3. Display the budget on the UI
		UICtrl.displayBudget(budget);
		//		console.log(budget);
	};

	var updatePercentages = function () {
		// 1. Calculate percentages
		budgetCtrl.calculatePercentages();

		// 2. Read percentages from the budget controller
		var percentages = budgetCtrl.getPercentages();

		// 3. Update the UI with the new percentages
		UICtrl.displayPercentages(percentages);
		//		console.log(percentages);
	};

	return {
		init: function () {
			UICtrl.displayDate();
			UICtrl.displayBudget({
				budget: 0,
				totalInc: 0,
				totalExp: 0,
				percentage: -1
			});
			console.log('Application has started.');
			setupEventListeners();
		}
	};

})(budgetController, uiController);

// Utility functions
function isEmpty(str) {
	return str.replace(/^\s+|\s+$/g, '').length === 0;
}

// Main App flow
appController.init();
// See https://www.udemy.com/the-complete-javascript-course/learn/v4/questions/2025856

// Jonas's solution 
//function findParent(el, className) {
//	while((el = el.parentElement) && !el.classList.contains(className));
//	return el;
//}
//
//itemDelete = findParent(event.target, 'item__delete');
//if (itemDelete) itemID = itemDelete.parentNode.parentNode.id;

// Another solution offered by a student on the same thread
//re= /exp-\d+|inc-\d+/ //matches inc-xx or exp-xx
// 
// function findParent(el) {
// while (!re.test(el.id)){
// el = el.parentNode
//     if (el===document){
//         break
//     }} 
// return el.id 
// }
// itemID= findParent(event.target)

// Alternative formatNumber function...handles large numbers
//formatNumber = function(num,type){
//            var numSplit,int,dec,len,numOfComa;
//            num = Math.abs(num);
//            num = num.toFixed(2);
//            numSplit = num.split('.');
//            int = numSplit[0];
//        
//            len = int.length;
//            console.log('len is:'+ len);
//            if(len > 3){
//                if (len % 3 === 0){
//                    numOfComa = Math.floor(len / 3) -1;
//                }
//                else{
//                    numOfComa = Math.floor(len / 3);
//                }
//                
//                for (var i = 1; i <= numOfComa; i++){
//                    int = int.substr(0, len-(3 * i)) + ',' + int.substr(len - (3 * i));
//                }
//            }
//            dec = numSplit[1];
//            
//            return (type === 'exp' ? '-' : '+') + ' ' + int + '.' + dec;
//        };
