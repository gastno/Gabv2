const isSameId = (left, right) => left !== undefined && right !== undefined && String(left) === String(right);

const isAppointmentAccessible = (actor, appointment, assignedBrandIds = []) => {
  if (!actor || !appointment) return false;
  if (actor.type === 'customer') return isSameId(actor.id, appointment.customer_id);
  if (actor.type !== 'staff') return false;
  if (actor.role === 'super_admin') return true;
  if (actor.role === 'admin') {
    return assignedBrandIds.some(brandId => isSameId(brandId, appointment.brand_id));
  }
  return actor.role === 'staff' && isSameId(actor.id, appointment.staff_id);
};

const canTransitionAppointment = (currentStatus, nextStatus) => ({
  pending: ['confirmed'],
  confirmed: ['completed', 'no_show'],
}[currentStatus] || []).includes(nextStatus);

module.exports = { canTransitionAppointment, isAppointmentAccessible };