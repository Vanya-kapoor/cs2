export const Messages = {
  // Generic
  SUCCESS: 'Success',
  CREATED: 'Created successfully',
  UPDATED: 'Updated successfully',
  DELETED: 'Deleted successfully',
  NOT_FOUND: 'Resource not found',
  INTERNAL_ERROR: 'Internal server error',
  VALIDATION_ERROR: 'Validation error',
  UNAUTHORIZED: 'Unauthorized',
  FORBIDDEN: 'Forbidden - insufficient permissions',
  ROUTE_NOT_FOUND: 'Route not found',

  // Auth
  AUTH_REQUIRED: 'Authentication required',
  INVALID_TOKEN: 'Invalid or expired token',
  LOGOUT_SUCCESS: 'Logged out successfully',

  // FAQ
  FAQ_NOT_FOUND: 'FAQ not found',
  FAQ_CREATED: 'FAQ created successfully',
  FAQ_UPDATED: 'FAQ updated successfully',
  FAQ_DELETED: 'FAQ deleted successfully',
  FAQ_PROMOTED: 'Query promoted to FAQ successfully',
  FAQ_ALREADY_EXISTS_FOR_QUERY: 'A FAQ already exists for this query',

  // Query
  QUERY_NOT_FOUND: 'Query not found',
  QUERY_CREATED: 'Query raised successfully',
  QUERY_DELETED: 'Query deleted successfully',
  QUERY_ALREADY_RESOLVED: 'This query has already been resolved',
  QUERY_NOT_RESOLVED: 'Query must be resolved before promoting to FAQ',

  // Reply
  REPLY_NOT_FOUND: 'Reply not found',
  REPLY_ADDED: 'Reply added successfully',
  REPLY_APPROVED: 'Reply approved successfully',
  REPLY_ALREADY_APPROVED: 'This reply has already been approved',
  NO_APPROVED_REPLY: 'No approved reply found for this query',

  // Chat
  QUESTION_REQUIRED: 'Question is required',
  SESSION_CLEARED: 'Session cleared',
  NO_RELEVANT_INFO: 'I could not find relevant information for your question.',
} as const;
