// Parents see every course. A child sees only the courses a parent assigned.
export function isAssigned(active, assignments, courseId) {
  if (!active || active.role !== 'child') return true
  return (assignments[active.id] || []).includes(courseId)
}

export function visibleCourses(courses, active, assignments) {
  return courses.filter(course => isAssigned(active, assignments, course.id))
}
