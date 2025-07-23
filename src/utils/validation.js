export function validateRequired(value, fieldName) {
  if (!value || value.toString().trim() === '') {
    return `${fieldName} is required`;
  }
  return null;
}

export function validateEmail(email) {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!emailRegex.test(email)) {
    return 'Please enter a valid email address';
  }
  return null;
}

export function validateAmount(amount) {
  const numAmount = parseFloat(amount);
  if (isNaN(numAmount) || numAmount < 0) {
    return 'Please enter a valid amount';
  }
  return null;
}

export function validateDate(date) {
  if (!date) {
    return 'Date is required';
  }
  const selectedDate = new Date(date);
  if (isNaN(selectedDate.getTime())) {
    return 'Please enter a valid date';
  }
  return null;
}

export function validateDateRange(fromDate, toDate) {
  if (!fromDate || !toDate) {
    return 'Both dates are required';
  }
  
  const from = new Date(fromDate);
  const to = new Date(toDate);
  
  if (from > to) {
    return 'End date must be after start date';
  }
  
  return null;
}

export function validateTravelId(id) {
  if (!id || id.toString().trim() === '') {
    return 'Travel ID is required';
  }
  
  const numId = parseInt(id);
  if (isNaN(numId) || numId <= 0) {
    return 'Travel ID must be a positive number';
  }
  
  return null;
}

export function validateFormData(data, rules) {
  const errors = {};
  
  for (const field in rules) {
    const rule = rules[field];
    const value = data[field];
    
    if (rule.required) {
      const error = validateRequired(value, rule.label || field);
      if (error) {
        errors[field] = error;
        continue;
      }
    }
    
    if (rule.type === 'email' && value) {
      const error = validateEmail(value);
      if (error) errors[field] = error;
    }
    
    if (rule.type === 'amount' && value !== undefined) {
      const error = validateAmount(value);
      if (error) errors[field] = error;
    }
    
    if (rule.type === 'date' && value) {
      const error = validateDate(value);
      if (error) errors[field] = error;
    }
    
    if (rule.custom && value) {
      const error = rule.custom(value);
      if (error) errors[field] = error;
    }
  }
  
  return Object.keys(errors).length > 0 ? errors : null;
}