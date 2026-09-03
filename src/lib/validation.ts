// src/lib/validation.ts

/**
 * Validates an email address using regex pattern
 * @param email - The email address to validate
 * @returns boolean - True if email is valid
 */
export const validateEmail = (email: string): boolean => {
    const emailRegex = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;
    return emailRegex.test(email);
  };
  
  /**
   * Validates a phone number using regex pattern
   * Supports international format including Pakistan numbers
   * @param phone - The phone number to validate
   * @returns boolean - True if phone is valid
   */
  export const validatePhone = (phone: string): boolean => {
    // Regex for international phone numbers including Pakistan format
    // This pattern supports:
    // - International format: +92 331 4815161
    // - Local format: 03314815161
    // - With or without spaces/dashes
    const phoneRegex = /^(\+92|92|0)?(\s|-)?3\d{2}(\s|-)?\d{3}(\s|-)?\d{4}$/;
    return phoneRegex.test(phone);
  };
  
  /**
   * Validates a name (basic validation)
   * @param name - The name to validate
   * @returns boolean - True if name is valid
   */
  export const validateName = (name: string): boolean => {
    // Basic validation: at least 2 characters, only letters and spaces
    return name.trim().length >= 2 && /^[a-zA-Z\s]+$/.test(name);
  };
  
  /**
   * Validates a message (basic validation)
   * @param message - The message to validate
   * @returns boolean - True if message is valid
   */
  export const validateMessage = (message: string): boolean => {
    // Basic validation: at least 10 characters
    return message.trim().length >= 10;
  };