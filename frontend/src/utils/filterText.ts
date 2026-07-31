export const getFilterText = (type: string, val?: string): string => {
  switch (type) {
    case 'BY_TAG':
      return `Tag: ${val || 'None'}`;
    case 'HAS_ORDERS':
      return 'Users with Orders';
    case 'HAS_LEADS':
      return 'Users with Leads';
    default:
      return 'All Bot Users';
  }
};
