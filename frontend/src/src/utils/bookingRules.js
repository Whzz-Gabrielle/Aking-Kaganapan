// Mirrors the server's allowed booking status changes (routes/bookingRoutes.js).
export const STATUS_FLOW = {
  Pending: ['Approved', 'Cancelled'],
  Approved: ['Completed', 'Cancelled'],
  Cancelled: ['Pending'],
  Completed: [],
};

export const nextStatuses = (current) => [current, ...(STATUS_FLOW[current] || [])];

export const balanceOf = (b) => Math.max(0, Number(b.totalPrice || 0) - Number(b.amountPaid || 0));

// A client can cancel until something has been verified as paid.
export const clientCanCancel = (b) =>
  ['Pending', 'Approved'].includes(b.bookingStatus) && Number(b.amountPaid || 0) === 0;

// A client can pay once approved and priced, while a balance remains.
export const clientCanPay = (b) =>
  b.bookingStatus === 'Approved' && Number(b.totalPrice || 0) > 0 && balanceOf(b) > 0;
