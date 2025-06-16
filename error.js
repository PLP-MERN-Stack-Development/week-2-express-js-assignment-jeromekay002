// this page is to list the related errors based on status code 

// 1. not found error
class NotFoundError extends Error {
    constructor(message){
        super(message);
        this.name = 'NotFoundError';
        this.statusCode = 404;
    }
}

// 2. for the validation error
class ValidationError extends Error {
  constructor(message) {
    super(message);
    this.name = 'ValidationError';
    this.statusCode = 400;
  }
}

module.exports = {
    NotFoundError,
    ValidationError
};