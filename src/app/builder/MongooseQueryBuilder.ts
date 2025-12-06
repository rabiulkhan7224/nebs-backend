import { FilterQuery, Query } from 'mongoose'
/**
 * MongoDB Query Builder class for building complex queries with chaining methods
 */
class QueryBuilder<T> {
  public modelQuery: Query<T[], T>
  public query: Record<string, unknown>
  constructor(modelQuery: Query<T[], T>, query: Record<string, unknown>) {
    this.modelQuery = modelQuery
    this.query = query
  }
  /**
   * Add search functionality to the query
   * @param searchableFields - Array of fields to search in
   * @returns QueryBuilder instance for chaining
   */
  search(searchableFields: string[]): this {
    const searchTerm = this.query.search as string
    if (searchTerm) {
      this.modelQuery = this.modelQuery.find({
        $or: searchableFields.map(
          field =>
            ({
              [field]: { $regex: searchTerm, $options: 'i' }
            }) as FilterQuery<T>
        )
      })
    }
    return this
  }
  /**
   * Add filtering to the query
   * @returns QueryBuilder instance for chaining
   */
  filter(): this {
    const queryObj = { ...this.query }
    const excludeFields = ['search', 'sort', 'page', 'limit', 'fields']
    excludeFields.forEach(el => delete queryObj[el])

    this.modelQuery = this.modelQuery.find(queryObj as FilterQuery<T>)
    return this
  }
  /**
   * Add sorting to the query
   * @returns QueryBuilder instance for chaining
   */
  sort(): this {
    const sortField =
      (this.query.sort as string)?.split(',')?.join(' ') || '-createdAt'
    this.modelQuery = this.modelQuery.sort(sortField)
    return this
  }
  /**
   * Add pagination to the query
   * @returns QueryBuilder instance for chaining
   */
  paginate(): this {
    const page = Number(this.query.page) || 1
    const limit = Number(this.query.limit) || 10
    const skip = (page - 1) * limit

    this.modelQuery = this.modelQuery.skip(skip).limit(limit)
    return this
  }
  /**
   * Field selection to include/exclude specific fields
   * @returns QueryBuilder instance for chaining
   */
  fields(): this {
    const fields =
      (this.query.fields as string)?.split(',')?.join(' ') || '-__v'
    this.modelQuery = this.modelQuery.select(fields)
    return this
  }
  /**
   * Get total count and pagination metadata
   * @returns Object with pagination metadata
   */
  async countTotal(): Promise<{
    page: number
    limit: number
    totalData: number
    totalPage: number
  }> {
    const totalQueries = this.modelQuery.getFilter()
    const totalData = await this.modelQuery.model.countDocuments(totalQueries)
    const page = Number(this.query.page) || 1
    const limit = Number(this.query.limit) || 10
    const totalPage = Math.ceil(totalData / limit)

    return {
      page,
      limit,
      totalData,
      totalPage
    }
  }
}
export default QueryBuilder
