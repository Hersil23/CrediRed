const calculateDueDate = (unit: string, quantity: number) => {
  const now = new Date();
  let daysToAdd;

  if (unit === 'quincena') {
    daysToAdd = quantity * 15;
  } else if (unit === 'semana') {
    daysToAdd = quantity * 7;
  } else {
    daysToAdd = 15;
  }

  now.setDate(now.getDate() + daysToAdd);
  return now;
};

export default calculateDueDate;
