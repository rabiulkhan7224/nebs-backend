/* eslint-disable @typescript-eslint/no-unused-vars */
/* eslint-disable @typescript-eslint/no-explicit-any */
import { NextFunction, Request, Response } from 'express'
import { TErrorSource, TGenericErrorResponse } from '../interfaces/errors'
import { ZodError } from 'zod'
import handleZodValidationError from '../errors/handleZodValidationError'
import handleMongooseValidationError from '../errors/handleMongooseValidationError'
import handleMongooseCastError from '../errors/handleMongooseCastError'
import handleMongooseDuplicateError from '../errors/handleMongooseDuplicateError'
import AppError from '../errors/AppError'
import {
  removeSingleUploadedFile,
  removeUploadedFiles
} from '../utils/removeUploadedFiles'
import config from '../config'

/**
 * Global error handler middleware for MongoDB with Mongoose
 * Handles all types of errors and returns consistent error responses
 */
const globalErrorHandler = async (
  err: any,
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  // Initialize default error details
  let statusCode: number = 500
  let message: string = 'Something went wrong'
  let errorSources: TErrorSource[] = [
    {
      path: '',
      message: 'Something went wrong'
    }
  ]

  // Zod validation error handling
  if (err instanceof ZodError) {
    const simplifiedError: TGenericErrorResponse = handleZodValidationError(err)
    statusCode = simplifiedError.statusCode
    message = simplifiedError.message
    errorSources = simplifiedError.errorSources
  }
  // Mongoose validation error handling
  else if (err.name === 'ValidationError') {
    const simplifiedError: TGenericErrorResponse =
      handleMongooseValidationError(err)
    statusCode = simplifiedError.statusCode
    message = simplifiedError.message
    errorSources = simplifiedError.errorSources
  }
  // Mongoose cast error handling
  else if (err.name === 'CastError') {
    const simplifiedError: TGenericErrorResponse = handleMongooseCastError(err)
    statusCode = simplifiedError.statusCode
    message = simplifiedError.message
    errorSources = simplifiedError.errorSources
  }
  // Mongoose Duplicate error handling
  else if (err.code === 11000) {
    const simplifiedError: TGenericErrorResponse =
      handleMongooseDuplicateError(err)
    statusCode = simplifiedError.statusCode
    message = simplifiedError.message
    errorSources = simplifiedError.errorSources
  }
  // Custom AppError handling
  else if (err instanceof AppError) {
    statusCode = err.statusCode
    message = err.message
    errorSources = [
      {
        path: err.path || '',
        message: err.message
      }
    ]
  }
  // Built-in error handling
  else if (err instanceof Error) {
    message = err.message
    errorSources = [
      {
        path: '',
        message: err.message
      }
    ]
  }

  // Clean up uploaded files if they exist
  try {
    // Handle multiple files (req.files)
    if (req.files) {
      // Type assertion for files object with field names as keys
      const files = req.files as { [fieldname: string]: Express.Multer.File[] }
      await removeUploadedFiles(files)
    }

    // Handle single file (req.file)
    if (req.file) {
      await removeSingleUploadedFile(req.file.path)
    }
  } catch (cleanupError) {
    console.error('Error during file cleanup:', cleanupError)
    // Don't throw the cleanup error, just log it
  }

  // Send error response
  res.status(statusCode).json({
    status: statusCode,
    success: false,
    message,
    error: errorSources,
    stack: config.NODE_ENV === 'development' ? err.stack : null
  })
}

export default globalErrorHandler
