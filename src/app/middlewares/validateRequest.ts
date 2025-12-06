/* eslint-disable @typescript-eslint/no-explicit-any */
import { AnyZodObject, ZodError, ZodIssue } from 'zod'
import { Request, Response, NextFunction } from 'express'
import catchAsync from '../utils/catchAsync'
import AppError from '../errors/AppError'

/**
 * Request validation middleware using Zod schemas
 * Creates a middleware function that validates the request against the provided Zod schema
 *
 * @param schema - Zod schema object to validate against
 * @returns Express middleware function
 *
 * @example
 * // Define a schema for user registration
 * const userSchema = z.object({
 *   body: z.object({
 *     email: z.string().email(),
 *     password: z.string().min(8)
 *   }),
 *   params: z.object({
 *     id: z.string().uuid()
 *   })
 * });
 *
 * // Use the middleware
 * app.post('/users/:id', validateRequest(userSchema), userController.createUser);
 */
const validateRequest = (schema: AnyZodObject) => {
  return catchAsync(async (req: Request, res: Response, next: NextFunction) => {
    try {
      // Prepare the data to validate (body, cookies, and params)
      const dataToValidate = {
        body: req.body,
        cookies: req.cookies,
        params: req.params
      }

      // Validate the data against the schema
      await schema.parseAsync(dataToValidate)

      // If validation passes, proceed to the next middleware
      next()
    } catch (error) {
      // Handle Zod validation errors
      if (error instanceof ZodError) {
        // Format the Zod error into a more readable format
        const formattedErrors = error.errors.map((err: ZodIssue) => {
          // Base error object
          const errorObj: any = {
            path: err.path.join('.'),
            message: err.message,
            code: err.code
          }

          // Add expected and received only if they exist
          if ('expected' in err) {
            errorObj.expected = (err as any).expected
          }
          if ('received' in err) {
            errorObj.received = (err as any).received
          }

          return errorObj
        })

        // Throw an AppError with the validation details
        throw new AppError(
          400,
          'validation',
          'Request validation failed',
          JSON.stringify(formattedErrors)
        )
      }

      // For other types of errors, rethrow them
      next(error)
    }
  })
}

export default validateRequest
