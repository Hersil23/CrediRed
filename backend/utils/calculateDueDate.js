const calculateDueDate = (unit, quantity) => {
  const now = new Date();
  let daysToAdd;

  if (unit === 'quincena') {
    daysToAdd = quantity * 15;
  } else if (unit === 'semana') {
    daysToAdd = quantity * 7;
  } else {
    daysToAdd = 15; // default: 1 quincena
  }

  now.setDate(now.getDate() + daysToAdd);
  return now;
};

module.exports = calculateDueDate;
