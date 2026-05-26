export const errorHandler = (err, req, res, next) => {
  console.error(`[Error Handler] ${err.stack}`);
  
  const statusCode = err.status || err.statusCode || 500;
  const message = err.message || 'Internal Server Error';

  return res.status(statusCode).json({
    message,
    ...(process.env.NODE_ENV !== 'production' && { stack: err.stack })
  });
};
