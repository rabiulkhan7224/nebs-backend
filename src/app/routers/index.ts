import express, { Router } from 'express'
import { AuthModuleRoutes } from '../modules/auth/auth.route'
import { NoticeModuleRoutes } from '../modules/notice/notice.route'

/**
 * Main router configuration
 * This file serves as the central point for registering all module routes
 */
const routers: Router = express.Router()

/**
 * Array of module routes to be registered
 * Each object contains:
 * - path: The base path for the module (e.g., '/auth')
 * - route: The router instance for the module
 */
const moduleRoutes = [
  {
    path: '/auth',
    route: AuthModuleRoutes
  },
  {
    path: '/notice',
    route: NoticeModuleRoutes
  }
]

/**
 * Register all module routes
 * This loop iterates through the moduleRoutes array and registers each route
 * with its corresponding path
 */
moduleRoutes.forEach(route => {
  routers.use(route.path, route.route)
})

export default routers
