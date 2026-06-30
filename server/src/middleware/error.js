// // Centralized error handler — catches everything, returns clean JSON
// const errorHandler = (err, req, res, next) => {
//   let error = { ...err };
//   error.message = err.message;

//   // Log error in development
//   if (process.env.NODE_ENV === 'development') {
//     console.error('❌ Error:', err);
//   }

//   // Mongoose bad ObjectId
//   if (err.name === 'CastError') {
//     error.message = `Resource not found`;
//     error.statusCode = 404;
//   }

//   // Mongoose duplicate key (e.g. email already exists)
//   if (err.code === 11000) {
//     const field = Object.keys(err.keyValue)[0];
//     error.message = `${field.charAt(0).toUpperCase() + field.slice(1)} already exists`;
//     error.statusCode = 400;
//   }

//   // Mongoose validation error
//   if (err.name === 'ValidationError') {
//     error.message = Object.values(err.errors).map((val) => val.message).join(', ');
//     error.statusCode = 400;
//   }

//   res.status(error.statusCode || 500).json({
//     success: false,
//     message: error.message || 'Internal Server Error',
//     ...(process.env.NODE_ENV === 'development' && { stack: err.stack }),
//   });
// };

// module.exports = errorHandler;
const errorHandler = (err, req, res, next) => {
  console.error("========== ERROR ==========");
  console.error(err);
  console.error(err.stack);
  console.error("===========================");

  res.status(500).json({
    success: false,
    message: err.message,
    stack: err.stack,
  });
};

module.exports = errorHandler;