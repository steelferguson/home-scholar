export function hasFreeChoice(active) {
  return active?.role === 'child' && Boolean(active.free_choice_profiles?.profile_id)
}
export function isAssigned(active, assignments, courseId) {
  if (!active || active.role !== 'child' || hasFreeChoice(active)) return true
  return (assignments[active.id] || []).includes(courseId)
}

export function visibleCourses(courses, active, assignments) {
  return courses.filter(course => isAssigned(active, assignments, course.id))
}
